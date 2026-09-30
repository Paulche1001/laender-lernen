import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../theme/useAppTheme";

type Props = {
  title: string;
  text: string;
  emoji?: string;
  buttonLabel?: string;
  onPress?: () => void;
};

export function LearningStateCard({
  title,
  text,
  emoji,
  buttonLabel,
  onPress,
}: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.centerPage}>
      <View
        style={[
          styles.stateCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {emoji && (
          <Text
            style={[
              styles.emoji,
              {
                color: colors.text,
              },
            ]}
          >
            {emoji}
          </Text>
        )}

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.text,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {text}
        </Text>

        {buttonLabel && onPress && (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed
                  ? colors.primaryPressed
                  : colors.primary,
              },
            ]}
            onPress={onPress}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  stateCard: {
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  text: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },

  emoji: {
    fontSize: 48,
  },

  button: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
