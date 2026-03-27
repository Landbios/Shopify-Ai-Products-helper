import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [total, active] = await Promise.all([
    prisma.upsellRule.count({ where: { shop } }),
    prisma.upsellRule.count({ where: { shop, status: "active" } }),
  ]);

  return { total, active };
};

export default function Dashboard() {
  const { total, active } = useLoaderData<typeof loader>();

  return (
    <s-page heading="SmartUpsell Engine">
      <s-button slot="primary-action" href="/app/rules/new" variant="primary">
        Create Upsell Rule
      </s-button>

      <s-stack direction="block" gap="base">
        {/* Summary Cards */}
        <s-section heading="Overview">
          <s-stack direction="inline" gap="base">
            <s-box padding="base" border="base" borderRadius="base">
              <s-stack direction="block" gap="small">
                <s-text tone="neutral">Total Rules</s-text>
                <s-heading>{String(total)}</s-heading>
              </s-stack>
            </s-box>

            <s-box padding="base" border="base" borderRadius="base">
              <s-stack direction="block" gap="small">
                <s-text tone="neutral">Active Rules</s-text>
                <s-heading>{String(active)}</s-heading>
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>

        {/* Empty state */}
        {total === 0 && (
          <s-section heading="Get Started">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                You don&apos;t have any upsell rules yet. Create your first rule to
                start boosting your Average Order Value.
              </s-paragraph>
              <s-button href="/app/rules/new" variant="primary">
                Create your first rule
              </s-button>
            </s-stack>
          </s-section>
        )}

        {/* Quick actions when rules exist */}
        {total > 0 && (
          <s-section heading="Quick Actions">
            <s-stack direction="inline" gap="base">
              <s-button href="/app/rules">View all rules</s-button>
              <s-button href="/app/rules/new" variant="primary">
                Add new rule
              </s-button>
            </s-stack>
          </s-section>
        )}

        {/* How it works */}
        <s-section heading="How it works">
          <s-stack direction="block" gap="base">
            <s-paragraph>
              <s-text>1. Define a rule</s-text> — Pick a trigger product and a
              recommended product.
            </s-paragraph>
            <s-paragraph>
              <s-text>2. Add the widget</s-text> — Go to Online Store →
              Customize and add the SmartUpsell block.
            </s-paragraph>
            <s-paragraph>
              <s-text>3. Increase AOV</s-text> — Customers see smart
              recommendations on the product page.
            </s-paragraph>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
