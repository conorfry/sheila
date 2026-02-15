import type { VisaType } from "@sheila/shared/types";

export interface VisaDefinition {
  id: VisaType;
  name: string;
  shortDescription: string;
  pointsRequired: number;
}

export const SUPPORTED_VISAS: VisaDefinition[] = [
  {
    id: "Subclass189",
    name: "Skilled Independent (189)",
    shortDescription:
      "Points-tested visa for skilled workers not sponsored by an employer or state.",
    pointsRequired: 65,
  },
  {
    id: "Subclass190",
    name: "Skilled Nominated (190)",
    shortDescription:
      "Points-tested visa requiring nomination by a state or territory government.",
    pointsRequired: 60,
  },
  {
    id: "Subclass482",
    name: "Temporary Skill Shortage (482)",
    shortDescription:
      "Employer-sponsored temporary visa for occupations on the skills shortage list.",
    pointsRequired: 0,
  },
];

export function getVisa(id: VisaType): VisaDefinition | undefined {
  return SUPPORTED_VISAS.find((v) => v.id === id);
}
