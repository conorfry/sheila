"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ScoringResult } from "@/lib/types";

interface QuizSectionProps {
  caseId: string;
  readOnly: boolean;
  onComplete: () => void;
}

export function QuizSection({ caseId, readOnly, onComplete }: QuizSectionProps) {
  const [age, setAge] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [qualification, setQualification] = useState("");
  const [partnerSkills, setPartnerSkills] = useState(false);
  const [employerSponsor, setEmployerSponsor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post(`/cases/${caseId}/quiz`, {
        responses: [
          { question_id: "age", answer_json: Number(age) },
          { question_id: "experience_years", answer_json: Number(experienceYears) },
          { question_id: "english_level", answer_json: englishLevel },
          { question_id: "qualification", answer_json: qualification },
          { question_id: "partner_skills", answer_json: partnerSkills },
          { question_id: "employer_sponsor", answer_json: employerSponsor },
        ],
      });

      const recommendation = await api.post<ScoringResult>(
        `/cases/${caseId}/recommendation`,
      );
      setResult(recommendation);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  }

  if (readOnly && !result) {
    return (
      <section>
        <h2 className="text-lg font-semibold">Visa Assessment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assessment has been completed.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">Visa Assessment</h2>

      {!result ? (
        <form onSubmit={handleSubmit} className="mt-4 max-w-lg space-y-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min={0}
              max={100}
              placeholder="e.g. 30"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_years">Years of Experience</Label>
            <Input
              id="experience_years"
              type="number"
              min={0}
              max={50}
              placeholder="e.g. 5"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="english_level">English Level</Label>
            <Select value={englishLevel} onValueChange={setEnglishLevel} required>
              <SelectTrigger id="english_level">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superior">Superior</SelectItem>
                <SelectItem value="proficient">Proficient</SelectItem>
                <SelectItem value="competent">Competent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualification">Highest Qualification</Label>
            <Select value={qualification} onValueChange={setQualification} required>
              <SelectTrigger id="qualification">
                <SelectValue placeholder="Select qualification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="masters">Masters</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
                <SelectItem value="diploma">Diploma / Trade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="partner_skills">Partner has skilled occupation?</Label>
            <Switch
              id="partner_skills"
              checked={partnerSkills}
              onCheckedChange={setPartnerSkills}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="employer_sponsor">Have employer sponsorship?</Label>
            <Switch
              id="employer_sponsor"
              checked={employerSponsor}
              onCheckedChange={setEmployerSponsor}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Recommendation
          </Button>
        </form>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Primary Visa</p>
                <p className="font-medium">
                  {result.primaryVisa.replace("Subclass", "Subclass ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fallback Visa</p>
                <p className="font-medium">
                  {result.fallbackVisa.replace("Subclass", "Subclass ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="font-medium">{result.pointsTotal}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rationale</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {result.rationale.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
