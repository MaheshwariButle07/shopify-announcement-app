import { useLoaderData, useActionData, useNavigation, useSubmit } from "react-router";
import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  TextField,
  BlockStack,
  InlineStack,
  Banner,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import connectDB from "../mongoose.server";
import Announcement from "../models/Announcement";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  let existingAnnouncement = "";

  // 1. Try to fetch the metafield from Shopify first
  try {
    const response = await admin.graphql(
      `#graphql
      query GetShopMetafield {
        shop {
          metafield(namespace: "my_app", key: "announcement") {
            value
          }
        }
      }`
    );
    const result = await response.json();
    existingAnnouncement = result.data?.shop?.metafield?.value || "";
  } catch (error) {
    console.error("Error fetching metafield from Shopify:", error);
  }

  // 2. Try to connect to MongoDB to verify connection status
  let mongoConnected = false;
  try {
    await connectDB();
    mongoConnected = true;
  } catch (error) {
    console.warn("MongoDB connection status check failed:", error.message);
  }

  return {
    existingAnnouncement,
    mongoConnected,
    shop,
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const text = formData.get("announcement") || "";

  // 1. Save to MongoDB (Audit Trail)
  let mongoSaved = false;
  let mongoError = null;
  try {
    await connectDB();
    await Announcement.create({
      text: text,
      shop: shop,
      createdAt: new Date(),
    });
    mongoSaved = true;
  } catch (error) {
    console.error("Error saving to MongoDB:", error);
    mongoError = error.message;
  }

  // 2. Sync to Shopify Shop Metafield
  let shopifySaved = false;
  let shopifyError = null;
  try {
    const shopQuery = await admin.graphql(
      `#graphql
      query {
        shop {
          id
        }
      }`
    );
    const shopData = await shopQuery.json();
    const shopId = shopData.data?.shop?.id;

    if (!shopId) {
      throw new Error("Could not retrieve Shop GID from Shopify Admin API");
    }

    const metafieldMutation = await admin.graphql(
      `#graphql
      mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              namespace: "my_app",
              key: "announcement",
              type: "single_line_text_field",
              value: text,
              ownerId: shopId,
            },
          ],
        },
      }
    );

    const mutationResult = await metafieldMutation.json();
    const errors = mutationResult.data?.metafieldsSet?.userErrors || [];
    if (errors.length > 0) {
      shopifyError = errors.map((e) => e.message).join(", ");
    } else {
      shopifySaved = true;
    }
  } catch (error) {
    console.error("Error syncing with Shopify:", error);
    shopifyError = error.message;
  }

  return {
    success: mongoSaved && shopifySaved,
    mongoSaved,
    mongoError,
    shopifySaved,
    shopifyError,
    savedAnnouncement: text,
  };
};

export default function Index() {
  const { existingAnnouncement, mongoConnected, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [announcement, setAnnouncement] = useState(existingAnnouncement);
  const isSaving = navigation.state === "submitting";

  // Update text field when loader retrieves a new value
  useEffect(() => {
    setAnnouncement(existingAnnouncement);
  }, [existingAnnouncement]);

  const handleSave = () => {
    submit({ announcement }, { method: "POST" });
  };

  return (
    <Page title="Announcement Banner Settings">
      <Layout>
        {/* Banner indicating DB connection status */}
        {!mongoConnected && (
          <Layout.Section>
            <Banner
              title="Database Configuration Required"
              tone="warning"
            >
              <p>
                MongoDB connection is not established. Please replace the placeholder connection string in your <code>.env</code> file with your MongoDB Atlas connection string.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {actionData?.success && (
          <Layout.Section>
            <Banner
              title="Announcement saved successfully!"
              tone="success"
            />
          </Layout.Section>
        )}

        {(actionData?.mongoError || actionData?.shopifyError) && (
          <Layout.Section>
            <Banner
              title="Error updating announcement"
              tone="critical"
            >
              <BlockStack gap="200">
                {actionData.mongoError && (
                  <p><strong>MongoDB Error:</strong> {actionData.mongoError}</p>
                )}
                {actionData.shopifyError && (
                  <p><strong>Shopify Error:</strong> {actionData.shopifyError}</p>
                )}
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <Box padding="200">
                <Text as="h2" variant="headingMd">
                  Set Your Announcement Banner Text
                </Text>
                <Text as="p" color="subdued">
                  This text will float across all pages on your storefront via the Theme App Extension.
                </Text>
              </Box>

              <TextField
                label="Announcement Text"
                value={announcement}
                onChange={setAnnouncement}
                autoComplete="off"
                placeholder="e.g., Sale 50% Off! Use code SALE50"
                maxLength={100}
                helpText="Keep it under 100 characters for best display on mobile screens."
              />

              <InlineStack align="end">
                <Button
                  variant="primary"
                  loading={isSaving}
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  Save Announcement
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                Active Storefront Shop
              </Text>
              <Text as="p" variant="bodyMd">
                <code>{shop}</code>
              </Text>

              <Text as="h3" variant="headingSm">
                MongoDB Audit Log Status
              </Text>
              <Text as="p" variant="bodyMd">
                {mongoConnected ? (
                  <span style={{ color: "green", fontWeight: "bold" }}>● Connected</span>
                ) : (
                  <span style={{ color: "red", fontWeight: "bold" }}>● Disconnected</span>
                )}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}