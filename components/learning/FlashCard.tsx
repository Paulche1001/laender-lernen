import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { flagImages } from "../../assets/flagImages";
import { countries } from "../../data/countries";
import { useAppTheme } from "../../theme/useAppTheme";

type Country = (typeof countries)[number];

type Props = {
  country: Country;
  revealed: boolean;
  onReveal: () => void;
};

export function FlashCard({ country, revealed, onReveal }: Props) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.flashcard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.countryName,
          {
            color: colors.text,
          },
        ]}
      >
        {country.name}
      </Text>

      {revealed ? (
        <View style={styles.answer}>
          <View
            style={[
              styles.flagContainer,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              source={flagImages[country.flag]}
              resizeMode="contain"
              style={styles.flag}
            />
          </View>

          <View style={styles.details}>
            <View>
              <Text
                style={[
                  styles.detailLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Hauptstadt
              </Text>

              <Text
                style={[
                  styles.detailValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {country.capital}
              </Text>
            </View>

            <View>
              <Text
                style={[
                  styles.detailLabel,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Sprachen
              </Text>

              <Text
                style={[
                  styles.detailValue,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {country.languages.join(", ")}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.revealButton,
            {
              backgroundColor: pressed ? colors.primaryPressed : colors.primary,
            },
          ]}
          onPress={onReveal}
        >
          <Text style={styles.revealButtonText}>Antwort anzeigen</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flashcard: {
    flex: 1,
    width: "100%",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },

  countryName: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },

  answer: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },

  flagContainer: {
    width: "100%",
    maxWidth: 280,
    height: 170,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  flag: {
    width: "100%",
    height: "100%",
  },

  details: {
    width: "100%",
    gap: 16,
  },

  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 18,
    fontWeight: "600",
  },

  revealButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  revealButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
