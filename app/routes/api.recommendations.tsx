import type { LoaderFunctionArgs } from "react-router";
import { getActiveRecommendation } from "../models/rule.server";

/**
 * Public endpoint – no Shopify session auth required.
 * Called by the Theme App Extension via App Proxy or direct fetch.
 *
 * Query params:
 *   - productId: the Shopify product GID, e.g. "gid://shopify/Product/1234567890"
 *   - shop:      the shop domain, e.g. "my-store.myshopify.com"
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60",
  };

  if (!productId || !shop) {
    return new Response(
      JSON.stringify({ error: "Missing productId or shop parameter." }),
      { status: 400, headers },
    );
  }

  const rule = await getActiveRecommendation(shop, productId);

  if (!rule) {
    return new Response(JSON.stringify({ recommendation: null }), {
      status: 200,
      headers,
    });
  }

  try {
    const { unauthenticated } = await import("../shopify.server");
    const { admin } = await unauthenticated.admin(shop);
    
    const response = await admin.graphql(
      `#graphql
        query getProducts($triggerId: ID!, $recId: ID!) {
          trigger: product(id: $triggerId) {
            title
            variants(first: 1) { nodes { price } }
            featuredImage { url }
          }
          recommended: product(id: $recId) {
            title
            variants(first: 1) { nodes { id, price } }
            featuredImage { url }
          }
        }
      `,
      { 
        variables: { 
          triggerId: productId, 
          recId: rule.recommendedProductId 
        } 
      }
    );
    
    const { data } = await response.json();
    
    if (data?.recommended && data?.trigger) {
      return new Response(
        JSON.stringify({
          recommendation: {
            id: rule.id,
            productId: rule.recommendedProductId,
            productTitle: rule.recommendedProductTitle,
            // Fallback to database image if Admin GraphQL fails
            productImage: data.recommended.featuredImage?.url || rule.recommendedProductImage,
            productPrice: data.recommended.variants.nodes[0]?.price || "0.00",
            productVariantId: data.recommended.variants.nodes[0]?.id || null,
          },
          triggerProduct: {
            title: rule.triggerProductTitle,
            image: data.trigger.featuredImage?.url || null,
            price: data.trigger.variants.nodes[0]?.price || "0.00",
          }
        }),
        { status: 200, headers },
      );
    }
  } catch (error) {
    console.error("Failed to fetch fresh product data:", error);
  }

  // Fallback to minimal DB data if Admin API fails
  return new Response(
    JSON.stringify({
      recommendation: {
        id: rule.id,
        productId: rule.recommendedProductId,
        productTitle: rule.recommendedProductTitle,
        productImage: rule.recommendedProductImage,
      },
      triggerProduct: null
    }),
    { status: 200, headers },
  );
};
