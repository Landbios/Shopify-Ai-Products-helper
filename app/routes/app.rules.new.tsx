import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import { useActionData, Form, useNavigation, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { createRule } from "../models/rule.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect, useState, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return {};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const title = (formData.get("title") as string)?.trim();
  const triggerProductId = formData.get("triggerProductId") as string;
  const triggerProductTitle = formData.get("triggerProductTitle") as string;
  const recommendedProductId = formData.get("recommendedProductId") as string;
  const recommendedProductTitle = formData.get(
    "recommendedProductTitle",
  ) as string;
  const recommendedProductImage = formData.get(
    "recommendedProductImage",
  ) as string;
  const status = formData.get("status") as string;

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Title is required.";
  if (!triggerProductId)
    errors.triggerProductId = "Please select a trigger product.";
  if (!recommendedProductId)
    errors.recommendedProductId = "Please select a recommended product.";
  if (triggerProductId && triggerProductId === recommendedProductId)
    errors.recommendedProductId =
      "Trigger and recommended products must be different.";

  if (Object.keys(errors).length > 0) return { errors };

  await createRule({
    shop: session.shop,
    title,
    triggerProductId,
    triggerProductTitle,
    recommendedProductId,
    recommendedProductTitle,
    recommendedProductImage,
    status,
  });

  return redirect("/app/rules");
};

type ActionData = { errors?: Record<string, string> };

export default function NewRule() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors ?? {};

  const [triggerProductId, setTriggerProductId] = useState("");
  const [triggerProductTitle, setTriggerProductTitle] = useState("");
  const [recommendedProductId, setRecommendedProductId] = useState("");
  const [recommendedProductTitle, setRecommendedProductTitle] = useState("");
  const [recommendedProductImage, setRecommendedProductImage] = useState("");

  const selectTrigger = useCallback(async () => {
    const result = await shopify.resourcePicker({
      type: "product",
      multiple: false,
    });
    if (result && result.length > 0) {
      setTriggerProductId(result[0].id);
      setTriggerProductTitle(result[0].title);
    }
  }, [shopify]);

  const selectRecommended = useCallback(async () => {
    const result = await shopify.resourcePicker({
      type: "product",
      multiple: false,
    });
    if (result && result.length > 0) {
      setRecommendedProductId(result[0].id);
      setRecommendedProductTitle(result[0].title);
      setRecommendedProductImage(result[0].images?.[0]?.originalSrc || "");
    }
  }, [shopify]);

  useEffect(() => {
    if (actionData && !actionData.errors) {
      shopify.toast.show("Rule created!");
    }
  }, [actionData, shopify]);

  return (
    <s-page heading="Create Upsell Rule">
      <s-link slot="breadcrumb-actions" href="/app/rules">
        Upsell Rules
      </s-link>

      <Form method="post">
        {/* Hidden product fields */}
        <input type="hidden" name="triggerProductId" value={triggerProductId} />
        <input
          type="hidden"
          name="triggerProductTitle"
          value={triggerProductTitle}
        />
        <input
          type="hidden"
          name="recommendedProductId"
          value={recommendedProductId}
        />
        <input
          type="hidden"
          name="recommendedProductTitle"
          value={recommendedProductTitle}
        />
        <input
          type="hidden"
          name="recommendedProductImage"
          value={recommendedProductImage}
        />

        <s-stack direction="block" gap="base">
          {/* Rule Details */}
          <s-section heading="Rule Details">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Rule Title"
                name="title"
                placeholder="e.g. Snowboard → Helmet"
                error={errors.title}
                auto-complete="off"
              />

              {/* Trigger Product */}
              <s-stack direction="block" gap="small">
                <s-text>
                  <strong>Trigger Product</strong>
                </s-text>
                <s-paragraph>
                  The product that triggers the upsell widget.
                </s-paragraph>
                <s-stack direction="inline" gap="small">
                  <s-button onClick={selectTrigger}>
                    {triggerProductTitle
                      ? "Change Trigger Product"
                      : "Select Trigger Product"}
                  </s-button>
                  {triggerProductTitle && (
                    <s-badge tone="info">{triggerProductTitle}</s-badge>
                  )}
                </s-stack>
                {errors.triggerProductId && (
                  <s-banner tone="critical">{errors.triggerProductId}</s-banner>
                )}
              </s-stack>

              {/* Recommended Product */}
              <s-stack direction="block" gap="small">
                <s-text>
                  <strong>Recommended Product</strong>
                </s-text>
                <s-paragraph>
                  The product shown as a recommendation.
                </s-paragraph>
                <s-stack direction="inline" gap="small">
                  <s-button onClick={selectRecommended}>
                    {recommendedProductTitle
                      ? "Change Recommended Product"
                      : "Select Recommended Product"}
                  </s-button>
                  {recommendedProductTitle && (
                    <s-badge tone="success">{recommendedProductTitle}</s-badge>
                  )}
                </s-stack>
                {errors.recommendedProductId && (
                  <s-banner tone="critical">
                    {errors.recommendedProductId}
                  </s-banner>
                )}
              </s-stack>
            </s-stack>
          </s-section>

          {/* Status & Save */}
          <s-section heading="Settings">
            <s-stack direction="block" gap="base">
              <s-select label="Rule Status" name="status">
                <s-option value="active">Active</s-option>
                <s-option value="inactive">Inactive</s-option>
              </s-select>

              <s-stack direction="inline" gap="small">
                <s-button
                  variant="primary"
                  type="submit"
                  loading={isSubmitting}
                >
                  Save Rule
                </s-button>
                <s-button href="/app/rules">Cancel</s-button>
              </s-stack>
            </s-stack>
          </s-section>
        </s-stack>
      </Form>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
