import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { RetrievalStatus } from "./RetrievalStatus";
import { buildApiUrl } from "../../apiBase";

type CompletionReceiptPayload = {
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerProfilePhotoUrl?: string | null;
  driverName?: string | null;
  driverProfilePhotoUrl?: string | null;
  distanceMiles?: number;
  originalEstimatedMinutes?: number;
  detourMinuteRate?: number;
  baseCharge?: number;
  mileageCharge?: number;
  tipCharge?: number;
  totalCharge?: number;
  currency?: string;
  retrievalData?: any;
};

async function sendCompletionReceipt(retrievalId: string, payload: CompletionReceiptPayload) {
  try {
    const response = await fetch(buildApiUrl("/send-retrieval-receipt"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        retrievalId,
        ...payload,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Completion receipt send failed:", error);
    return null;
  }
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000);
  return null;
}

function calculateMileageCharge(distanceMiles: number, firstMileMinimum: number, perMileRate: number) {
  const safeMiles = Math.max(0, Number(distanceMiles || 0));
  const safeMinimum = Math.max(0, Number(firstMileMinimum || 0));
  const safePerMileRate = Math.max(0, Number(perMileRate || 0));
  return safeMinimum + Math.max(0, safeMiles - 1) * safePerMileRate;
}

function buildFinalPricing(payload?: CompletionReceiptPayload) {
  const retrievalData = payload?.retrievalData || {};
  const pricing = retrievalData?.pricing || {};
  const detour = retrievalData?.detour || {};
  const tracking = retrievalData?.tracking || {};
  const completedAt = new Date();
  const timedRetrievalStart =
    toDate(retrievalData?.statusTimestamps?.retrievalTimerStartedAtIso) ||
    toDate(retrievalData?.statusTimestamps?.retrievalTimerStartedAt) ||
    null;
  const inProgressAt =
    timedRetrievalStart ||
    toDate(retrievalData?.statusTimestamps?.inProgressAtIso) ||
    toDate(retrievalData?.statusTimestamps?.inProgressAt) ||
    toDate(retrievalData?.createdAt) ||
    completedAt;

  const actualDurationMinutes = Math.max(1, Math.ceil((completedAt.getTime() - inProgressAt.getTime()) / 60000));
  const originalEstimatedMinutes = Math.max(
    1,
    Math.round(Number(payload?.originalEstimatedMinutes || pricing.originalEstimatedMinutes || 1))
  );
  const distanceMiles = Math.max(0, Number(payload?.distanceMiles || tracking.liveMileageMiles || pricing.distanceMiles || 0));
  const perMileRate = Number(pricing.perMileRate || 3);
  const firstMileMinimum = Number(pricing.firstMileMinimum || 30);
  const detourMinuteRate = Number(payload?.detourMinuteRate || pricing.detourMinuteRate || 3);
  const mileageCharge = calculateMileageCharge(distanceMiles, firstMileMinimum, perMileRate);
  const detourStartedAt = toDate(detour?.startedAtIso) || toDate(detour?.startedAt);
  const detourEndedAt = toDate(detour?.endedAtIso) || toDate(detour?.endedAt) || completedAt;
  const detourMinutes = detourStartedAt
    ? Math.max(0, Math.ceil((detourEndedAt.getTime() - detourStartedAt.getTime()) / 60000))
    : Math.max(0, actualDurationMinutes - originalEstimatedMinutes);
  const detourTimeCharge = detourMinutes * detourMinuteRate;
  const subtotalBeforeTip = mileageCharge + detourTimeCharge;
  const tipPercent = Number(pricing.tipPercent || 20);
  const tipCharge = subtotalBeforeTip * (tipPercent / 100);
  const totalCharge = subtotalBeforeTip + tipCharge;

  return {
    completedAtIso: completedAt.toISOString(),
    actualDurationMinutes,
    originalEstimatedMinutes,
    detourMinutes,
    detourMinuteRate,
    detourTimeCharge,
    mileageCharge,
    subtotalBeforeTip,
    tipPercent,
    tipCharge,
    totalCharge,
    distanceMiles,
    currency: String(payload?.currency || pricing.currency || "USD"),
  };
}

export async function updateRetrievalStatus(
  retrievalId: string,
  status: RetrievalStatus,
  completionReceiptPayload?: CompletionReceiptPayload,
  extraUpdateFields?: Record<string, unknown>
) {
  const ref = doc(db, "retrieval", retrievalId);

  const updatePayload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
    ...(extraUpdateFields || {}),
  };

  if (status === "in_progress") {
    updatePayload["statusTimestamps.inProgressAt"] = serverTimestamp();
    updatePayload["statusTimestamps.inProgressAtIso"] = new Date().toISOString();
  }

  let finalPricing: ReturnType<typeof buildFinalPricing> | null = null;
  if (status === "completed" && completionReceiptPayload) {
    finalPricing = buildFinalPricing(completionReceiptPayload);
    updatePayload["statusTimestamps.completedAt"] = serverTimestamp();
    updatePayload["statusTimestamps.completedAtIso"] = finalPricing.completedAtIso;
    updatePayload["pricing.originalEstimatedMinutes"] = finalPricing.originalEstimatedMinutes;
    updatePayload["pricing.actualDurationMinutes"] = finalPricing.actualDurationMinutes;
    updatePayload["pricing.detourMinutes"] = finalPricing.detourMinutes;
    updatePayload["pricing.detourMinuteRate"] = finalPricing.detourMinuteRate;
    updatePayload["pricing.detourTimeCharge"] = finalPricing.detourTimeCharge;
    updatePayload["pricing.distanceMiles"] = finalPricing.distanceMiles;
    updatePayload["pricing.mileageCharge"] = finalPricing.mileageCharge;
    updatePayload["pricing.subtotalBeforeTip"] = finalPricing.subtotalBeforeTip;
    updatePayload["pricing.tipPercent"] = finalPricing.tipPercent;
    updatePayload["pricing.tipCharge"] = finalPricing.tipCharge;
    updatePayload["pricing.totalCharge"] = finalPricing.totalCharge;
    updatePayload["billing.chargeStatus"] = "pending_charge_attempt";
  }

  await updateDoc(ref, updatePayload);

  // timeline entry
  const timelineRef = collection(db, "retrieval", retrievalId, "timeline");
  await addDoc(timelineRef, {
    status,
    timestamp: serverTimestamp(),
  });

  if (status === "completed" && completionReceiptPayload && finalPricing) {
    const receiptResponse = await sendCompletionReceipt(retrievalId, {
      ...completionReceiptPayload,
      mileageCharge: finalPricing.mileageCharge,
      tipCharge: finalPricing.tipCharge,
      totalCharge: finalPricing.totalCharge,
      currency: finalPricing.currency,
      lineItems: {
        mileageMiles: finalPricing.distanceMiles,
        mileageCharge: finalPricing.mileageCharge,
        originalEstimatedMinutes: finalPricing.originalEstimatedMinutes,
        actualDurationMinutes: finalPricing.actualDurationMinutes,
        detourMinutes: finalPricing.detourMinutes,
        detourMinuteRate: finalPricing.detourMinuteRate,
        detourTimeCharge: finalPricing.detourTimeCharge,
        subtotalBeforeTip: finalPricing.subtotalBeforeTip,
        tipPercent: finalPricing.tipPercent,
        tipCharge: finalPricing.tipCharge,
        totalCharge: finalPricing.totalCharge,
      },
      chargeCustomer: true,
      chargeAmount: finalPricing.totalCharge,
    } as CompletionReceiptPayload & Record<string, unknown>);

    if (receiptResponse) {
      await updateDoc(ref, {
        "billing.receiptResponse": receiptResponse,
        "billing.chargeStatus": receiptResponse.charge?.succeeded
          ? "charged"
          : receiptResponse.charge?.attempted
            ? "charge_failed"
            : "charge_not_attempted",
        updatedAt: serverTimestamp(),
      });
    }
  }
}
