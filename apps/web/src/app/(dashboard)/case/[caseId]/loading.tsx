import { Skeleton } from "@/components/ui/skeleton";

export default function CaseLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
