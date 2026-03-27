import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { useSubmit, useActionData, useNavigation, Form } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { generateUpsellRules } from "../services/ai.server";
import { createRulesBulk } from "../models/rule.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "generate") {
    // 1. Fetch products using GraphQL
    const response = await admin.graphql(
      `#graphql
      query {
        products(first: 50, query: "status:ACTIVE") {
          nodes {
            id
            title
            featuredImage {
              url
            }
          }
        }
      }`
    );
    const data = await response.json();
    const products = data.data.products.nodes;

    if (!products || products.length === 0) {
        return { rules: null, error: "No active products found in your store to analyze." };
    }

    // 2. Generate Rules via Gemini
    try {
      const aiRules = await generateUpsellRules(products);
      return { rules: aiRules, error: null };
    } catch (err: any) {
      return { rules: null, error: err.message };
    }
  }

  if (intent === "save") {
    const rulesJson = formData.get("rules") as string;
    const rules = JSON.parse(rulesJson);
    
    // Map to UpsellRuleInput
    const dbRules = rules.map((r: any) => ({
      shop: session.shop,
      title: `AI generated: ${r.triggerProductTitle} → ${r.recommendedProductTitle}`,
      triggerProductId: r.triggerProductId,
      triggerProductTitle: r.triggerProductTitle,
      recommendedProductId: r.recommendedProductId,
      recommendedProductTitle: r.recommendedProductTitle,
      recommendedProductImage: r.recommendedProductImage,
      status: "active",
    }));

    await createRulesBulk(dbRules);
    return { success: true };
  }

  return null;
};

export default function AutoGenerateRules() {
  const actionData = useActionData<any>();
  const navigation = useNavigation();

  const isGenerating = navigation.state === "submitting" && navigation.formData?.get("intent") === "generate";
  const isSaving = navigation.state === "submitting" && navigation.formData?.get("intent") === "save";

  const generatedRules = actionData?.rules;
  const error = actionData?.error;
  const success = actionData?.success;

  return (
    <s-page heading="AI Auto-Generate Rules">
      <s-link slot="breadcrumb-actions" href="/app/rules">
        Upsell Rules
      </s-link>

      <s-stack direction="block" gap="base">
        {error && <s-banner tone="critical">{error}</s-banner>}
        {success && <s-banner tone="success">Rules successfully saved to your store!</s-banner>}

        <s-section heading="Generate with Gemini AI">
          <s-paragraph>
            Let Google Gemini analyze your active products and automatically suggest the best cross-sell combinations to boost your average order value.
          </s-paragraph>
          
          <Form method="post">
            <input type="hidden" name="intent" value="generate" />
            <s-button variant="primary" type="submit" loading={isGenerating}>
              Analyze Products & Generate Rules
            </s-button>
          </Form>
        </s-section>

        {generatedRules && generatedRules.length > 0 && !success && (
          <s-section heading="Suggested Rules">
            <s-stack direction="block" gap="base">
              {generatedRules.map((rule: any, i: number) => (
                <s-box padding="base" border="base" borderRadius="base" key={i}>
                  <s-stack direction="inline" gap="small">
                    {rule.recommendedProductImage && (
                      <img src={rule.recommendedProductImage} alt="" style={{width: 60, height: 60, borderRadius: 8, objectFit: 'cover'}} />
                    )}
                    <s-stack direction="block" gap="small">
                      <s-text><strong>Trigger:</strong> {rule.triggerProductTitle}</s-text>
                      <s-text><strong>Recommend:</strong> {rule.recommendedProductTitle}</s-text>
                      <s-text><strong>Because:</strong> {rule.reason}</s-text>
                    </s-stack>
                  </s-stack>
                </s-box>
              ))}

              <Form method="post">
                <input type="hidden" name="intent" value="save" />
                <input type="hidden" name="rules" value={JSON.stringify(generatedRules)} />
                <s-button variant="primary" type="submit" loading={isSaving}>
                  Save All Suggested Rules
                </s-button>
              </Form>
            </s-stack>
          </s-section>
        )}
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
