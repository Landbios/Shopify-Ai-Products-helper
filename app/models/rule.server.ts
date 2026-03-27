import prisma from "../db.server";

export type UpsellRuleInput = {
  shop: string;
  title: string;
  triggerProductId: string;
  triggerProductTitle: string;
  recommendedProductId: string;
  recommendedProductTitle: string;
  recommendedProductImage?: string;
  status?: string;
};

export async function getRulesByShop(shop: string) {
  return prisma.upsellRule.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}

export async function countRules(shop: string, status?: string) {
  return prisma.upsellRule.count({
    where: { shop, ...(status ? { status } : {}) },
  });
}

export async function createRule(data: UpsellRuleInput) {
  return prisma.upsellRule.create({
    data: {
      ...data,
      status: data.status === "inactive" ? "inactive" : "active",
    },
  });
}

export async function createRulesBulk(rules: UpsellRuleInput[]) {
  return prisma.upsellRule.createMany({
    data: rules.map((r) => ({
      ...r,
      status: r.status === "inactive" ? "inactive" : "active",
    })),
  });
}

export async function deleteRule(id: string, shop: string) {
  return prisma.upsellRule.deleteMany({
    where: { id, shop },
  });
}

export async function getActiveRecommendation(shop: string, triggerProductId: string) {
  return prisma.upsellRule.findFirst({
    where: {
      shop,
      triggerProductId,
      status: "active",
    },
    select: {
      id: true,
      triggerProductTitle: true,
      recommendedProductId: true,
      recommendedProductTitle: true,
      recommendedProductImage: true,
    },
  });
}
