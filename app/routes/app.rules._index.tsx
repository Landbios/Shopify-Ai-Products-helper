import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { useLoaderData, useSubmit } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const rules = await prisma.upsellRule.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return { rules };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;

  await prisma.upsellRule.deleteMany({
    where: { id, shop: session.shop },
  });

  return { ok: true };
};

export default function RulesIndex() {
  const { rules } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      submit({ id }, { method: "DELETE" });
    }
  };

  return (
    <s-page
      heading="Upsell Rules"
      primaryAction={
        <s-button href="/app/rules/new" variant="primary">
          Create Rule
        </s-button>
      }
    >

      {rules.length === 0 ? (
        <s-section>
          <s-stack direction="block" gap="base">
            <s-paragraph>
              No upsell rules yet. Create your first rule to get started.
            </s-paragraph>
            <s-button href="/app/rules/new" variant="primary">
              Create your first rule
            </s-button>
          </s-stack>
        </s-section>
      ) : (
        <s-stack direction="block" gap="base">
          {rules.map((rule) => (
            <s-box
              key={rule.id}
              padding="base"
              border="base"
              borderRadius="base"
            >
              <s-stack direction="inline" gap="base">
                <s-stack direction="block" gap="small">
                  <s-stack direction="inline" gap="small">
                    <s-heading>{rule.title}</s-heading>
                    <s-badge
                      tone={rule.status === "active" ? "success" : "warning"}
                    >
                      {rule.status === "active" ? "Active" : "Inactive"}
                    </s-badge>
                  </s-stack>
                  <s-paragraph>
                    Trigger: {rule.triggerProductTitle}
                    {" → "}
                    Recommend: {rule.recommendedProductTitle}
                  </s-paragraph>
                </s-stack>

                <s-stack direction="inline" gap="small">
                  <s-button href={`/app/rules/${rule.id}`}>Edit</s-button>
                  <s-button
                    tone="critical"
                    onClick={() => handleDelete(rule.id)}
                  >
                    Delete
                  </s-button>
                </s-stack>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
