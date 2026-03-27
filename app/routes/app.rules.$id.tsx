import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  HeadersFunction,
} from "react-router";
import {
  useLoaderData,
  useActionData,
  Form,
  useNavigation,
  redirect,
} from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect, useState, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const rule = await prisma.upsellRule.findFirst({
    where: { id: params.id, shop: session.shop },
  });
  if (!rule) throw new Response("Not Found", { status: 404 });
  return { rule };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  if (request.method === "DELETE") {
    await prisma.upsellRule.deleteMany({ where: { id: params.id, shop } });
    return redirect("/app/rules");
  }

  const formData = await request.formData();
  const title = (formData.get("title") as string)?.trim();
  const triggerProductId = formData.get("triggerProductId") as string;
  const triggerProductTitle = formData.get("triggerProductTitle") as string;
  const recommendedProductId = formData.get("recommendedProductId") as string;
  const recommendedProductTitle = formData.get(
    "recommendedProductTitle",
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

  await prisma.upsellRule.updateMany({
    where: { id: params.id, shop },
    data: {
      title,
      triggerProductId,
      triggerProductTitle,
      recommendedProductId,
      recommendedProductTitle,
      status: status === "inactive" ? "inactive" : "active",
    },
  });

  return redirect("/app/rules");
};

type ActionData = { errors?: Record<string, string> };

export default function EditRule() {
  const { rule } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors ?? {};

  const [triggerProductId, setTriggerProductId] = useState(
    rule.triggerProductId,
  );
  const [triggerProductTitle, setTriggerProductTitle] = useState(
    rule.triggerProductTitle,
  );
  const [recommendedProductId, setRecommendedProductId] = useState(
    rule.recommendedProductId,
  );
  const [recommendedProductTitle, setRecommendedProductTitle] = useState(
    rule.recommendedProductTitle,
  );

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
    }
  }, [shopify]);

  useEffect(() => {
    if (actionData && !actionData.errors) {
      shopify.toast.show("Rule updated!");
    }
  }, [actionData, shopify]);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this rule?")) {
      // Submit a DELETE form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/app/rules/${rule.id}`;
      const methodInput = document.createElement("input");
      methodInput.type = "hidden";
      methodInput.name = "_method";
      methodInput.value = "DELETE";
      form.appendChild(methodInput);
      document.body.appendChild(form);
      form.submit();
    }
  };

  return (
    <s-page heading="Edit Upsell Rule">
      <s-link slot="breadcrumbActions" href="/app/rules">
        Upsell Rules
      </s-link>
      <s-button slot="primaryAction" tone="critical" onClick={handleDelete}>
        Delete Rule
      </s-button>

      <Form method="post">
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

        <s-stack direction="block" gap="base">
          <s-section heading="Rule Details">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Rule Title"
                name="title"
                defaultValue={rule.title}
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
                    Change Trigger Product
                  </s-button>
                  <s-badge tone="info">{triggerProductTitle}</s-badge>
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
                    Change Recommended Product
                  </s-button>
                  <s-badge tone="success">{recommendedProductTitle}</s-badge>
                </s-stack>
                {errors.recommendedProductId && (
                  <s-banner tone="critical">
                    {errors.recommendedProductId}
                  </s-banner>
                )}
              </s-stack>
            </s-stack>
          </s-section>

          <s-section heading="Settings">
            <s-stack direction="block" gap="base">
              <s-select label="Rule Status" name="status">
                <s-option
                  value="active"
                  selected={rule.status === "active" ? true : undefined}
                >
                  Active
                </s-option>
                <s-option
                  value="inactive"
                  selected={rule.status === "inactive" ? true : undefined}
                >
                  Inactive
                </s-option>
              </s-select>

              <s-stack direction="inline" gap="small">
                <s-button
                  variant="primary"
                  type="submit"
                  loading={isSubmitting}
                >
                  Save Changes
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
