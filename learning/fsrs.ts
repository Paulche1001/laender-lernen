import { fsrs, Rating as FsrsRating } from "ts-fsrs";

export type Rating = "again" | "hard" | "good" | "easy";

export const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ["1m", "10m"],
  relearning_steps: ["10m"],
});

export function toFsrsRating(rating: Rating) {
  switch (rating) {
    case "again":
      return FsrsRating.Again;

    case "hard":
      return FsrsRating.Hard;

    case "good":
      return FsrsRating.Good;

    case "easy":
      return FsrsRating.Easy;
  }
}
