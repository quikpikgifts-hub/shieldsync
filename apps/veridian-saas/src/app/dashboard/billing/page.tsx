import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { invoices } from "@/data/dashboard";
import { pricingTiers } from "@/data/site";

export default function BillingPage() {
  const currentPlan = pricingTiers[2];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your plan, payment method, and invoices.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Current plan</CardTitle>
            <Button variant="outline" size="sm">
              Change plan
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent-soft p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-accent">{currentPlan.name} plan</div>
                <div className="mt-1 font-display text-2xl font-bold">
                  {currentPlan.price}
                  <span className="text-sm font-normal text-muted-foreground">{currentPlan.period}</span>
                </div>
              </div>
              <StatusBadge status="Active" />
            </div>
            <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {currentPlan.features.map((f) => (
                <li key={f} className="text-sm text-muted-foreground">
                  · {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">Visa •••• 4242</div>
                <div className="text-xs text-muted-foreground">Expires 08/28</div>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full">
              Update payment method
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Invoice history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Invoice</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Download</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium">{invoice.id}</td>
                    <td className="px-6 py-4 text-muted-foreground">{invoice.date}</td>
                    <td className="px-6 py-4 text-muted-foreground">{invoice.amount}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer">
                        <Download className="h-4 w-4" />
                      </button>
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
