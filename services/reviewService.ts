import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase/config";
import type { Rating } from "../learning/fsrs";

type SaveReviewParams = {
  userId: string;
  countryCode: string;
  rating: Rating;
  reviewedAt: Date;
  log: unknown;
};

export async function saveReview({
  userId,
  countryCode,
  rating,
  reviewedAt,
  log,
}: SaveReviewParams) {
  await addDoc(collection(db, "users", userId, "reviews"), {
    countryCode,
    rating,
    reviewedAt,
    log,
    updatedAt: serverTimestamp(),
  });
}
