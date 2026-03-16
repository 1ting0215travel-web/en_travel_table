export default async function EditTravelPage({
  params,
}: {
  params: { id: string };
}) {
  const { redirect } = await import('next/navigation');
  redirect(`/travels?edit=${params.id}`);
}
