import { CaseView } from "@/components/CaseView";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseView id={id} />;
}
