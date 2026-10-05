import { Pressable, StyleSheet, Text, View } from "react-native";
import { Rating as FsrsRating, type IPreview } from "ts-fsrs";

import { type Rating } from "../../learning/fsrs";
import { useAppTheme } from "../../theme/useAppTheme";
import { getIntervalLabel } from "../../utils/formatInterval";

type Props = {
  preview: IPreview;
  onRate: (rating: Rating) => void;
  disabled?: boolean;
};

export function RatingButtons({ preview, onRate, disabled = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.ratingSection}>
      <Text
        style={[
          styles.ratingTitle,
          {
            color: colors.textMuted,
          },
        ]}
      >
        Wie gut wusstest du es?
      </Text>

      <View style={styles.ratingRow}>
        <Pressable
          style={[
            styles.ratingButton,
            {
              backgroundColor: colors.danger,
            },
          ]}
          disabled={disabled}
          onPress={() => onRate("again")}
        >
          <Text style={styles.ratingText}>Nochmal</Text>

          <Text style={styles.intervalText}>
            {getIntervalLabel(preview[FsrsRating.Again].card.due)}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.ratingButton, styles.hardButton]}
          disabled={disabled}
          onPress={() => onRate("hard")}
        >
          <Text style={styles.ratingText}>Schwer</Text>

          <Text style={styles.intervalText}>
            {getIntervalLabel(preview[FsrsRating.Hard].card.due)}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.ratingButton, styles.goodButton]}
          disabled={disabled}
          onPress={() => onRate("good")}
        >
          <Text style={styles.ratingText}>Gut</Text>

          <Text style={styles.intervalText}>
            {getIntervalLabel(preview[FsrsRating.Good].card.due)}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.ratingButton,
            {
              backgroundColor: colors.success,
            },
          ]}
          disabled={disabled}
          onPress={() => onRate("easy")}
        >
          <Text style={styles.ratingText}>Einfach</Text>

          <Text style={styles.intervalText}>
            {getIntervalLabel(preview[FsrsRating.Easy].card.due)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ratingSection: {
    gap: 10,
  },

  ratingTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  ratingButton: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  hardButton: {
    backgroundColor: "#D97706",
  },

  goodButton: {
    backgroundColor: "#2563EB",
  },

  ratingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  intervalText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 3,
    opacity: 0.85,
  },
});
