"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export function StrengthsWeaknesses({
  strengths,
  weaknesses,
}: StrengthsWeaknessesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600 text-base">
            <CheckCircle2 className="h-5 w-5" />
            优势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-600 text-base">
            <XCircle className="h-5 w-5" />
            待改进
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {weaknesses.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
