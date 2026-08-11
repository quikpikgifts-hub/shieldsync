// Reads an org's entitlement for a product. No product_entitlements row
// exists for any org yet (billing isn't live — see ACTIVATION.md), so the
// honest default is "unmetered", matching the Settings billing card's own
// existing copy ("the workspace runs unmetered until billing is wired
// up") rather than silently blocking access nothing has been sold yet.
import { supabaseSelect } from "./supabase.js";

export async function getEntitlement(orgId, productKey) {
  const rows = await supabaseSelect(
    "product_entitlements",
    `org_id=eq.${encodeURIComponent(orgId)}&product_key=eq.${encodeURIComponent(productKey)}&select=status,updated_at&limit=1`
  );
  if (!rows || rows.length === 0) return { status: "unmetered", source: "default" };
  return { status: rows[0].status, updatedAt: rows[0].updated_at, source: "billing" };
}
