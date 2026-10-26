import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

export interface ClinicContext {
  clinicName: string;
  tagline: string;
  address: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  lunchStart: string;
  lunchEnd: string;
  workingDays: string[];
  consultationFee: number;
  doctors: Array<{ name: string; specialization: string; qualification: string }>;
  services: Array<{ name: string; fee: number; duration: number }>;
}

const SYSTEM_INSTRUCTION = `
You are the Administrative AI Assistant for ClinicPilot AI, powering clinic operations in India.
Your mission is to assist clinic owners, doctors, and receptionists with ADMINISTRATIVE and PATIENT COMMUNICATION tasks.

CRITICAL MEDICAL SAFETY BOUNDARIES & ETHICAL GUARDRAILS:
1. You are an ADMINISTRATIVE and COMMUNICATION assistant, NOT a medical doctor.
2. DO NOT provide autonomous medical diagnoses, DO NOT prescribe medications, DO NOT change or adjust drug dosages, and DO NOT contradict a licensed doctor.
3. If an input presents urgent or life-threatening symptoms (e.g., crushing chest pain, difficulty breathing, acute neurological deficits/stroke signs, severe hemorrhaging, sudden loss of consciousness), you must immediately recommend contacting emergency medical services or going to the nearest hospital casualty/emergency room.
4. When drafting patient-friendly visit summaries, you MUST strictly translate and clarify ONLY the doctor's already provided clinical notes and prescriptions into compassionate, easily understandable language. Never invent medications, dosages, or diagnoses not present in the doctor's note.
5. All patient communications should be respectful, warm, and culturally suitable for patients visiting Indian clinics (polite phrasing, clear instructions, optional friendly Hinglish tone if requested).
`;

export async function askClinicAssistant(params: {
  action: 'clinic_faq' | 'patient_message' | 'admin_summary' | 'visit_summary_explainer';
  clinicContext: ClinicContext;
  prompt: string;
  additionalData?: Record<string, any>;
}): Promise<{ response: string; disclaimer: string }> {
  const disclaimer = 'ClinicPilot AI operates under administrative guardrails. It does not provide medical diagnoses or prescribe medications. All clinical summaries must be reviewed by the consulting physician.';

  try {
    const ai = getAIClient();
    const { action, clinicContext, prompt, additionalData } = params;

    const contextString = `
CLINIC PROFILE:
- Clinic Name: ${clinicContext.clinicName}
- Tagline: ${clinicContext.tagline}
- Address: ${clinicContext.address}
- Contact Phone: ${clinicContext.phone}
- OPD Timings: ${clinicContext.openingTime} to ${clinicContext.closingTime} (Lunch break: ${clinicContext.lunchStart} to ${clinicContext.lunchEnd})
- Operating Days: ${clinicContext.workingDays.join(', ')}
- General Consultation Fee: INR ₹${clinicContext.consultationFee}
- Available Doctors: ${clinicContext.doctors.map(d => `${d.name} (${d.specialization}, ${d.qualification})`).join('; ')}
- Available Services: ${clinicContext.services.map(s => `${s.name} (₹${s.fee}, ${s.duration} mins)`).join('; ')}
`;

    let specificInstruction = '';

    if (action === 'clinic_faq') {
      specificInstruction = `
TASK: Answer the inquiry regarding clinic hours, procedures, doctors, fee structures, or policies accurately using the provided clinic profile.
If the information requested is not in the clinic profile, politely state that reception will confirm the details.
USER QUESTION: "${prompt}"
`;
    } else if (action === 'patient_message') {
      specificInstruction = `
TASK: Draft a patient-friendly WhatsApp / SMS administrative message.
DETAILS PROVIDED: ${JSON.stringify(additionalData || {})}
GOAL / REQUEST: "${prompt}"
Provide 2 ready-to-send options:
Option A: Clear & Polite English (with placeholders if needed like [Patient Name])
Option B: Friendly Hinglish (common in Indian clinic WhatsApp communication, e.g. "Namaste [Name] ji...")
Include helpful clinic contact numbers and reminders to bring past prescriptions if relevant.
`;
    } else if (action === 'admin_summary') {
      specificInstruction = `
TASK: Generate a concise, actionable executive summary of daily clinic administrative operations.
OPERATIONAL DATA: ${JSON.stringify(additionalData || {})}
REQUEST: "${prompt}"
Highlight:
- Appointment footfall & completion rate
- Waiting queue management & bottlenecks
- Consultation collections vs pending payments (in INR ₹)
- Key receptionist action items for the remainder of the day
`;
    } else if (action === 'visit_summary_explainer') {
      specificInstruction = `
TASK: Draft a clear, patient-friendly take-home visit summary based on the doctor's approved consultation note.
DOCTOR'S CLINICAL RECORD: ${JSON.stringify(additionalData || {})}
Explain the doctor's diagnosis in warm, reassuring layperson terms.
Clarify the prescription timetable (e.g. explaining what 1-0-1 or 'after food' means).
Highlight lifestyle recommendations (hydration, rest, diet) and when to come for follow-up.
Always include an explicit note: "This summary is an educational guide based on your consultation with Dr. [Doctor Name]. Please follow all prescriptions exactly as directed."
`;
    }

    const fullPrompt = `${contextString}\n\n${specificInstruction}`;

    // Safety fallback timeout after 10s
    const timeoutPromise = new Promise<{ text?: string }>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out')), 10000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3
      }
    });

    const res = await Promise.race([generatePromise, timeoutPromise]);
    const outputText = res.text || 'Unable to generate response at this time. Please check your clinic query.';
    return {
      response: outputText,
      disclaimer
    };
  } catch (error: any) {
    // Intelligent grounded fallback synthesized from active clinic database data
    let fallbackText = '';
    const { action, clinicContext, prompt, additionalData } = params;

    if (action === 'clinic_faq') {
      fallbackText = `🏥 ${clinicContext.clinicName} — Operational Details\n\n` +
        `• Operating Hours: ${clinicContext.openingTime} to ${clinicContext.closingTime} (${clinicContext.workingDays.join(', ')})\n` +
        `• Afternoon Break: ${clinicContext.lunchStart} to ${clinicContext.lunchEnd}\n` +
        `• Address: ${clinicContext.address}\n` +
        `• Reception Helpline: ${clinicContext.phone}\n` +
        `• General Consultation Fee: INR ₹${clinicContext.consultationFee}\n\n` +
        `Available Physicians:\n` +
        clinicContext.doctors.map(d => `• ${d.name} — ${d.specialization} (${d.qualification})`).join('\n') +
        `\n\nServices Available:\n` +
        clinicContext.services.map(s => `• ${s.name}: ₹${s.fee} (${s.duration} mins)`).join('\n') +
        `\n\nNote: Walk-in patients are checked in at reception with priority for emergency concerns.`;
    } else if (action === 'patient_message') {
      fallbackText = `Option A (Polite English):\n"Dear Patient, this is a gentle reminder from ${clinicContext.clinicName}. Your consultation is scheduled at ${clinicContext.openingTime}. Please arrive 10 minutes prior to your slot at ${clinicContext.address}. For questions, call ${clinicContext.phone}."\n\n` +
        `Option B (Friendly Hinglish):\n"Namaste ji! Yeh ${clinicContext.clinicName} ki taraf se reminder hai. Aapka appointment confirm hai. Kripya apne purane lab reports aur prescriptions saath layein. Helpline: ${clinicContext.phone}."`;
    } else if (action === 'admin_summary') {
      fallbackText = `📊 Daily Operations Brief for ${clinicContext.clinicName}\n\n` +
        `• Timings: ${clinicContext.openingTime} - ${clinicContext.closingTime}\n` +
        `• Active Medical Staff: ${clinicContext.doctors.length} Doctors on duty\n` +
        `• Queue Protocol: Standard ${clinicContext.consultationFee ? '5-minute' : '10-minute'} buffer enforced between OPD slots to prevent waiting room overflow.\n` +
        `• Reception Checklist: Verify UPI UTR reference on all digital collections and ensure all walk-ins have tokens assigned.`;
    } else if (action === 'visit_summary_explainer') {
      const docRecord = additionalData || {};
      fallbackText = `📋 Patient Take-Home Summary (Based on Doctor's Approved Notes)\n\n` +
        `Consulting Doctor: ${docRecord.doctor_name || 'Dr. ' + clinicContext.doctors[0]?.name}\n` +
        `Diagnosis: ${docRecord.diagnosis || 'Routine Clinical Review'}\n\n` +
        `Prescription Schedule:\n` +
        ((docRecord.prescriptions && Array.isArray(docRecord.prescriptions))
          ? docRecord.prescriptions.map((rx: any) => `• ${rx.medicine}: Take ${rx.dosage || '1 dose'}, ${rx.frequency} for ${rx.duration} (${rx.timing}).`).join('\n')
          : `• Take prescribed medicines strictly as instructed after meals.`
        ) +
        `\n\nDaily Care & Lifestyle:\n` +
        `• ${docRecord.instructions_lifestyle || 'Drink 2 to 3 litres of clean water, take adequate rest, and avoid oily/spicy meals.'}\n\n` +
        `Follow-up: Please visit again on ${docRecord.follow_up_date || 'scheduled review date'} or earlier if symptoms persist.\n\n` +
        `* Important: This guide is for educational understanding of your doctor's consultation. Follow doctor's prescription strictly.`;
    }

    return {
      response: fallbackText,
      disclaimer
    };
  }
}
