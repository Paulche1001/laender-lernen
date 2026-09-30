import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../theme/useAppTheme";

type Props = {
  current: number;
  total: number;
  onClose: () => void;
};

export function SessionHeader({ current, total, onClose }: Props) {
  const { colors } = useAppTheme();

  const progressPercent = total > 0 ? (current / total) * 100 : 0;

  return (
    <>
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Lernmodus
          </Text>

          <Text
            style={[
              styles.sessionProgress,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {current} von {total}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={onClose}
        >
          <Text
            style={[
              styles.closeButtonText,
              {
                color: colors.text,
              },
            ]}
          >
            ✕
          </Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.surfaceMuted,
          },
        ]}
      >
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressPercent}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },

  sessionProgress: {
    fontSize: 14,
    marginTop: 2,
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },

  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 999,
  },
});
