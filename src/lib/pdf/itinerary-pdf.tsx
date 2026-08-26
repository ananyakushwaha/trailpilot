import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  agencyName: { fontSize: 16, fontWeight: 700, color: "#4338ca" },
  title: { fontSize: 18, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  metaItem: { fontSize: 9, color: "#475569" },
  metaLabel: { fontWeight: 700, color: "#1e293b" },
  day: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  dayTitle: { fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#4338ca" },
  fieldLabel: { fontSize: 8, fontWeight: 700, color: "#64748b", marginTop: 4 },
  fieldValue: { fontSize: 9.5, lineHeight: 1.4 },
  footer: { marginTop: 20, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

export type ItineraryPdfData = {
  agencyName: string;
  title: string;
  destination: string;
  numDays: number;
  numNights: number;
  travellerCount: number;
  travelStartDate?: string | null;
  travelEndDate?: string | null;
  days: {
    dayNumber: number;
    title: string;
    activities: string;
    pickupDropNotes?: string | null;
    hotelStay?: string | null;
    inclusions?: string | null;
    exclusions?: string | null;
    importantInstructions?: string | null;
  }[];
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ItineraryDocument({ data }: { data: ItineraryPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.agencyName}>{data.agencyName}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>
          {data.destination} · {data.numDays} days / {data.numNights} nights
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>
            <Text style={styles.metaLabel}>Travellers: </Text>
            {data.travellerCount}
          </Text>
          {formatDate(data.travelStartDate) && (
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Dates: </Text>
              {formatDate(data.travelStartDate)} - {formatDate(data.travelEndDate)}
            </Text>
          )}
        </View>

        {data.days.map((day) => (
          <View key={day.dayNumber} style={styles.day} wrap={false}>
            <Text style={styles.dayTitle}>
              Day {day.dayNumber}: {day.title}
            </Text>
            <Text style={styles.fieldValue}>{day.activities}</Text>
            {day.hotelStay && (
              <>
                <Text style={styles.fieldLabel}>Hotel stay</Text>
                <Text style={styles.fieldValue}>{day.hotelStay}</Text>
              </>
            )}
            {day.pickupDropNotes && (
              <>
                <Text style={styles.fieldLabel}>Pickup / drop</Text>
                <Text style={styles.fieldValue}>{day.pickupDropNotes}</Text>
              </>
            )}
            {day.inclusions && (
              <>
                <Text style={styles.fieldLabel}>Inclusions</Text>
                <Text style={styles.fieldValue}>{day.inclusions}</Text>
              </>
            )}
            {day.exclusions && (
              <>
                <Text style={styles.fieldLabel}>Exclusions</Text>
                <Text style={styles.fieldValue}>{day.exclusions}</Text>
              </>
            )}
            {day.importantInstructions && (
              <>
                <Text style={styles.fieldLabel}>Important instructions</Text>
                <Text style={styles.fieldValue}>{day.importantInstructions}</Text>
              </>
            )}
          </View>
        ))}

        <Text style={styles.footer}>Prepared by {data.agencyName} via TrailOS</Text>
      </Page>
    </Document>
  );
}

export async function renderItineraryPdf(data: ItineraryPdfData): Promise<Buffer> {
  return renderToBuffer(<ItineraryDocument data={data} />);
}
