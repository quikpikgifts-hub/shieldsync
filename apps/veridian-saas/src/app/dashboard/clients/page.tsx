import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { clients } from "@/data/dashboard";

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">Organizations and sites in your workspace.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> Add client
        </Button>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Industry</th>
                  <th className="px-6 py-3 font-medium">Reports</th>
                  <th className="px-6 py-3 font-medium">Seats</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium">{client.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{client.industry}</td>
                    <td className="px-6 py-4 text-muted-foreground">{client.reports}</td>
                    <td className="px-6 py-4 text-muted-foreground">{client.seats}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={client.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
