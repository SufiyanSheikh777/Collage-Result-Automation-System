import React from 'react';
import { SubjectMarks } from '@/data/mockData';

interface MarksheetTableProps {
  subjects: SubjectMarks[];
}

const formatMark = (value: any): string => {
  // If the value is null, undefined, or already a dash, return '-' immediately
  if (value === null || value === undefined || value === '-') return '-';
  
  const strValue = value.toString().trim();
  if (strValue === '-' || strValue === '') return '-';

  // Only pad with zeros if it is a number
  return isNaN(Number(strValue)) ? strValue : strValue.padStart(3, '0');
};

const MarksheetTable: React.FC<MarksheetTableProps> = ({ subjects }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground/20">
            <th
              rowSpan={2}
              className="border border-border px-4 py-3 text-left font-semibold bg-muted/50 min-w-[280px]"
            >
              TITLE OF SUBJECTS
            </th>
            <th
              colSpan={6}
              className="border border-border px-2 py-2 text-center font-semibold bg-muted/50"
            >
              THEORY
            </th>
            <th
              colSpan={4}
              className="border border-border px-2 py-2 text-center font-semibold bg-muted/50"
            >
              PRACTICALS
            </th>
            <th
              colSpan={2}
              className="border border-border px-2 py-2 text-center font-semibold bg-muted/50"
            >
              SLA
            </th>
            <th
              rowSpan={2}
              className="border border-border px-3 py-3 text-center font-semibold bg-muted/50"
            >
              CREDITS
            </th>
          </tr>
          <tr className="border-b border-border">
            <th
              colSpan={2}
              className="border border-border px-2 py-1.5 text-center text-xs font-medium bg-muted/30"
            >
              FA-TH
            </th>
            <th
              colSpan={2}
              className="border border-border px-2 py-1.5 text-center text-xs font-medium bg-muted/30"
            >
              SA-TH
            </th>
            <th
              colSpan={2}
              className="border border-border px-2 py-1.5 text-center text-xs font-medium bg-muted/30"
            >
              TOTAL
            </th>
            <th
              colSpan={2}
              className="border border-border px-2 py-1.5 text-center text-xs font-medium bg-muted/30"
            >
              FA-PR
            </th>
            <th
              colSpan={2}
              className="border border-border px-2 py-1.5 text-center text-xs font-medium bg-muted/30"
            >
              SA-PR
            </th>
            <th className="border border-border px-2 py-1.5 text-center text-xs font-medium bg-muted/30">
              MAX
            </th>
            <th className="border border-border px-2 py-1.5 text-center text-xs font-medium bg-muted/30">
              OBT
            </th>
          </tr>
          <tr className="border-b border-border bg-muted/20">
            <th className="border border-border px-4 py-1"></th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">MAX</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">OBT</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">MAX</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">OBT</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">MAX</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">OBT</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">MAX</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">OBT</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">MAX</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">OBT</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">MAX</th>
            <th className="border border-border px-2 py-1 text-center text-xs font-medium">OBT</th>
            <th className="border border-border px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject, index) => (
            <tr
              key={index}
              className="border-b border-border hover:bg-muted/20 transition-colors"
            >
              <td className="border border-border px-4 py-3 font-medium text-foreground">
                {subject.subjectName}
              </td>
              {/* FA-TH */}
              <td className="border border-border px-2 py-2 text-center font-mono text-muted-foreground">
                {formatMark(subject.theory.faTh.max)}
              </td>
              <td className="border border-border px-2 py-2 text-center font-mono font-semibold">
                {formatMark(subject.theory.faTh.obt)}
              </td>
              {/* SA-TH */}
              <td className="border border-border px-2 py-2 text-center font-mono text-muted-foreground">
                {formatMark(subject.theory.saTh.max)}
              </td>
              <td className="border border-border px-2 py-2 text-center font-mono font-semibold">
                {formatMark(subject.theory.saTh.obt)}
              </td>
              {/* TOTAL */}
              <td className="border border-border px-2 py-2 text-center font-mono text-muted-foreground">
                {formatMark(subject.theory.total.max)}
              </td>
              <td className="border border-border px-2 py-2 text-center font-mono font-semibold">
                {formatMark(subject.theory.total.obt)}
              </td>
              {/* FA-PR */}
              <td className="border border-border px-2 py-2 text-center font-mono text-muted-foreground">
                {formatMark(subject.practicals.faPr.max)}
              </td>
              <td className="border border-border px-2 py-2 text-center font-mono font-semibold">
                {formatMark(subject.practicals.faPr.obt)}
              </td>
              {/* SA-PR */}
              <td className="border border-border px-2 py-2 text-center font-mono text-muted-foreground">
                {formatMark(subject.practicals.saPr.max)}
              </td>
              <td className="border border-border px-2 py-2 text-center font-mono font-semibold">
                {formatMark(subject.practicals.saPr.obt)}
              </td>
              {/* SLA */}
              <td className="border border-border px-2 py-2 text-center font-mono text-muted-foreground">
                {formatMark(subject.sla.max)}
              </td>
              <td className="border border-border px-2 py-2 text-center font-mono font-semibold">
                {formatMark(subject.sla.obt)}
              </td>
              {/* CREDITS */}
              <td className="border border-border px-3 py-2 text-center font-semibold text-primary">
                {subject.credits.toString().padStart(2, '0')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarksheetTable;
