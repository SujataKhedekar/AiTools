import crypto from "node:crypto";
import { createPresentation, findUserByUid, getOrCreateGoogleUser, incrementUserGenerations } from "@/components/deckai/db/queries";
import { editSlideWithAI, generateAlternativeLayoutsWithAI, generatePresentationWithAI } from "@/components/deckai/lib/ai-service";
import { getDeckUser, jsonError } from "@/components/deckai/server-auth";
import type { GenerateDeckParams, Slide } from "@/components/deckai/types/deck";
export const runtime = "nodejs";
const ser = (r: any) => ({ id:r.id, publicId:r.publicId, title:r.title, subtitle:r.subtitle, presentationType:r.presentationType, themeId:r.themeId, isFavorite:r.isFavorite, isPublic:r.isPublic, slides:r.slidesJson, googleSlidesId:r.googleSlidesId, googleSlidesUrl:r.googleSlidesUrl, createdAt:r.createdAt.toISOString(), updatedAt:r.updatedAt.toISOString() });
async function dbUser(request: Request) { const a=await getDeckUser(request); if(!a)return null; return (await findUserByUid(a.uid)) || (a.authProvider === "google" ? await getOrCreateGoogleUser(a.uid,a.email,a.displayName,a.avatarUrl) : null); }
export async function POST(request: Request, ctx: {params:{action:string}}) {
 try {
  const body=await request.json();
  if(ctx.params.action==="generate-deck") {
   if(!process.env.GEMINI_API_KEY) return jsonError("Deck generation requires GEMINI_API_KEY on the server.",503);
   const params=body as GenerateDeckParams; if(!params.prompt?.trim())return jsonError("Please describe the presentation you want to create.");
   const user=await dbUser(request); if(user && user.generationsUsed >= (({free:10,pro:100,business:1000} as Record<string, number>)[user.plan] || 10))return jsonError("Your plan's deck generation limit has been reached.",403);
   const generated=await generatePresentationWithAI(params);
   if(user){const saved=await createPresentation(user.id,{title:generated.title,subtitle:generated.subtitle,presentationType:params.presentationType||"Startup Pitch Deck",themeId:generated.themeId,slides:generated.slides}); await incrementUserGenerations(user.uid);return Response.json({presentation:ser(saved)},{status:201});}
   const now=new Date().toISOString(); return Response.json({presentation:{publicId:`draft_${crypto.randomUUID().slice(0,10)}`,title:generated.title,subtitle:generated.subtitle,presentationType:params.presentationType||"Startup Pitch Deck",themeId:generated.themeId,isFavorite:false,isPublic:false,slides:generated.slides,createdAt:now,updatedAt:now}});
  }
  if(!process.env.GEMINI_API_KEY)return jsonError("AI slide tools require GEMINI_API_KEY on the server.",503);
  const context=body.presentationContext||{title:"Presentation",presentationType:"Business Presentation",themeId:"cobalt-studio"};
  if(ctx.params.action==="edit-slide"){if(!body.slide||!body.instruction?.trim())return jsonError("Slide data and an editing instruction are required.");return Response.json({slide:await editSlideWithAI(body.slide as Slide,String(body.instruction),context)});}
  if(ctx.params.action==="alternative-layouts"){if(!body.slide)return jsonError("Slide data is required.");return Response.json({variations:await generateAlternativeLayoutsWithAI(body.slide as Slide,context)});}
  return jsonError("Unknown AI action.",404);
 } catch(e){ return jsonError(e instanceof Error?e.message:"AI request failed.",500); }
}
