import { getLocale } from "@/lib/locale-server";
import { BroadcastForm } from "@/components/admin/BroadcastForm";

export const dynamic = "force-dynamic";

export default async function AdminBroadcast() {
  const ar = (await getLocale()) === "ar";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "الإعلانات" : "Broadcast"}</h1>
        <p className="text-meta text-status-full">{ar ? "أرسلي رسالة جماعية للعضوات" : "Send a message to your members"}</p>
      </div>
      <BroadcastForm ar={ar} />
    </div>
  );
}
