import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
  },
  logoContainer: {
    alignItems: "flex-end",
  },
  logoAccent: {
    flexDirection: "row",
    marginBottom: 2,
  },
  logoAccentLine: {
    width: 4,
    height: 1.5,
    backgroundColor: "#eccf1d",
    marginRight: 1,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2b2e4d",
    marginBottom: 1,
  },
  logoSubtext: {
    fontSize: 8,
    color: "#2b2e4d",
  },
  logoBottomAccent: {
    flexDirection: "row",
    marginTop: 2,
  },
  logoBottomAccentLine: {
    width: 3,
    height: 1,
    backgroundColor: "#eccf1d",
    marginRight: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: "#888",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#888",
    minHeight: 45,
  },
  labelCell: {
    width: "30%",
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#888",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  valueCell: {
    width: "70%",
    padding: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  labelText: {
    fontWeight: "bold",
    fontSize: 10,
    textAlign: "left",
  },
  valueText: {
    fontSize: 10,
    textAlign: "left",
  },
  timeContainer: {
    flexDirection: "row",
    width: "100%",
  },
  timeCell: {
    width: "50%",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLabelText: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "left",
  },
  timeValueText: {
    fontSize: 10,
    textAlign: "right",
  },
});

interface DayOffRequestPDFProps {
  employeeName: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  reason: string;
}

export function DayOffRequestPDF({
  employeeName,
  date,
  timeFrom,
  timeTo,
  reason,
}: DayOffRequestPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: Title (left) and Logo (right) */}
        <View style={styles.header}>
          <Text style={styles.title}>Antrag auf Tagesbefreiung</Text>
          <View style={styles.logoContainer}>
            {/* Main text */}
            <Text style={styles.logoText}>TETRASAN</Text>
            <Text style={styles.logoSubtext}>Zukunftslösungen HEUTE</Text>
          </View>
        </View>

        {/* Table: Row-based layout */}
        <View style={styles.table}>
          {/* Row 1: Name */}
          <View style={styles.tableRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Name</Text>
            </View>
            <View style={styles.valueCell}>
              <Text style={styles.valueText}>{employeeName}</Text>
            </View>
          </View>

          {/* Row 2: Datum */}
          <View style={styles.tableRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Datum</Text>
            </View>
            <View style={styles.valueCell}>
              <Text style={styles.valueText}>{date}</Text>
            </View>
          </View>

          {/* Row 3: Uhrzeit (von/bis next to each other) */}
          <View style={styles.tableRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Uhrzeit</Text>
            </View>
            <View style={styles.valueCell}>
              <View style={styles.timeContainer}>
                <View style={styles.timeCell}>
                  <Text style={styles.timeLabelText}>von</Text>
                  <Text style={styles.timeValueText}>{timeFrom}</Text>
                </View>
                <View style={styles.timeCell}>
                  <Text style={styles.timeLabelText}>bis</Text>
                  <Text style={styles.timeValueText}>{timeTo}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Row 4: Grund für Termin */}
          <View style={styles.tableRow}>
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>Grund für Termin</Text>
            </View>
            <View style={styles.valueCell}>
              <Text style={styles.valueText}>{reason}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
