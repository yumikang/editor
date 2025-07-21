import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as fs from "fs/promises";
import * as path from "path";
import type { FontCollection } from "~/types/font-types";

const FONTS_DATA_PATH = path.join(process.cwd(), "app/data/global/custom-fonts.json");

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const fontId = formData.get("fontId") as string;
    
    if (!fontId) {
      return json({ error: "Font ID is required" }, { status: 400 });
    }
    
    // Read existing data
    const data = await fs.readFile(FONTS_DATA_PATH, "utf-8");
    const fontCollection: FontCollection = JSON.parse(data);
    
    // Find and remove font
    const initialLength = fontCollection.fonts.length;
    fontCollection.fonts = fontCollection.fonts.filter(f => f.id !== fontId);
    
    if (fontCollection.fonts.length === initialLength) {
      return json({ error: "Font not found" }, { status: 404 });
    }
    
    // Update metadata
    fontCollection.metadata.lastUpdated = new Date().toISOString();
    fontCollection.metadata.totalFonts = fontCollection.fonts.length;
    
    // Save to file
    await fs.writeFile(FONTS_DATA_PATH, JSON.stringify(fontCollection, null, 2));
    
    return json({
      success: true,
      message: "Font removed successfully"
    });
    
  } catch (error) {
    console.error("Error removing font:", error);
    return json({
      success: false,
      error: "Failed to remove font"
    }, { status: 500 });
  }
};