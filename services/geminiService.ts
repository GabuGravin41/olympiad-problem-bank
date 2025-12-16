import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { Topic, Difficulty, StyleGuide } from '../types';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const MODEL_ID = "gemini-3-pro-preview";

const formatStyleGuide = (style?: StyleGuide) => {
    if (!style) return "";
    return `
    Style Constraints:
    - Notation Preference: ${style.notation || "Standard IMO"}
    - Geometry Convention: ${style.geometryConvention || "Standard"}
    `;
}

export const generateProblemIdea = async (
  topic: Topic,
  difficulty: Difficulty,
  focusArea: string = "",
  style?: StyleGuide
): Promise<string> => {
  
  const prompt = `
    Generate a unique IMO-level problem in ${topic}.
    Difficulty level: ${difficulty}.
    ${focusArea ? `Focus specifically on: ${focusArea}.` : ''}
    ${formatStyleGuide(style)}
    
    The problem should be novel, or a clever disguise of a known result. 
    Provide the problem title and the statement clearly in LaTeX.
    
    Format:
    **Title**: [Title]
    **Statement**: [Problem Statement]
    **Concept**: [Brief explanation of the core idea]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });
    return response.text || "Failed to generate problem.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating problem. Please check your API key or try again.";
  }
};

export const generateProblemFromSketch = async (
  userSketch: string,
  style?: StyleGuide
): Promise<string> => {
  const prompt = `
    The user has provided a rough sketch, idea, or configuration for a math problem:
    "${userSketch}"
    ${formatStyleGuide(style)}

    1. Analyze this idea. Is it well-defined? Does it correspond to a known theorem?
    2. Formalize this into a rigorous IMO-style problem statement. 
    3. If the original idea is too simple, suggest a generalization or a harder variant suitable for an Olympiad.
    4. Provide the result in the standard format.

    Format:
    **Title**: [Proposed Title]
    **Statement**: [Formal Problem Statement in LaTeX]
    **Notes**: [Comments on how the sketch was adapted/formalized]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });
    return response.text || "Failed to process sketch.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error processing sketch.";
  }
};

export const refineProblem = async (
  currentStatement: string,
  instruction: string
): Promise<string> => {
  
  const prompt = `
    Current Problem Statement:
    ${currentStatement}

    Request: ${instruction}

    Please rewrite the problem statement based on the request. 
    Then, provide a brief commentary on what changed and why it improves the problem or meets the criteria.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });
    return response.text || "Failed to refine problem.";
  } catch (error) {
    console.error("Refinement Error:", error);
    return "Error refining problem.";
  }
};

export const generateSolutionAndLean = async (
  statement: string
): Promise<{ solution: string; lean: string }> => {
  
  const prompt = `
    For the following problem:
    ${statement}

    1. Provide a rigorous, step-by-step proof suitable for an official IMO solution booklet. Use $$ for display math.
    2. Provide the problem statement formalized in Lean 4 syntax (as a 'theorem' or 'example'). If possible, outline the proof structure in Lean comments.

    Output format:
    SPLIT_MARKER_SOLUTION
    [Full Proof Here]
    SPLIT_MARKER_LEAN
    [Lean 4 Code Here]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 8192 }
      }
    });
    
    const text = response.text || "";
    const parts = text.split("SPLIT_MARKER_LEAN");
    
    let solution = "";
    let lean = "";

    if (parts.length > 1) {
       solution = parts[0].replace("SPLIT_MARKER_SOLUTION", "").trim();
       lean = parts[1].trim();
    } else {
        solution = text;
        lean = "-- No Lean code generated successfully.";
    }

    // Clean up markdown code blocks
    lean = lean.replace(/```lean/g, "").replace(/```/g, "").trim();

    return { solution, lean };
  } catch (error) {
    console.error("Solution Gen Error:", error);
    return { solution: "Error generating solution.", lean: "-- Error" };
  }
};

export const checkSimilars = async (statement: string): Promise<string> => {
    const prompt = `
        Search your internal knowledge base for Math Olympiad problems (IMO, USAMO, RMM, etc.) that are similar to this one:
        ${statement}

        1. List any problems that share the same configuration or core idea.
        2. Judge if this problem is "Too Known" or "Standard".
        3. If it is a known theorem (e.g., Miquel Point, Simson Line), state it.
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "No similars found.";
    } catch (e) { return "Error checking similars."; }
};

export const stressTestProblem = async (statement: string): Promise<string> => {
    const prompt = `
        Perform a logical stress test on this problem:
        ${statement}

        1. Edge Cases: Check n=1, n=2, degenerate triangles, zero denominators, etc.
        2. Sufficiency vs Necessity: Did the author confuse "if" with "if and only if"?
        3. Ambiguity: Are there multiple interpretations?
        4. Triviality: Is the answer obvious?
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Stress test failed.";
    } catch (e) { return "Error running stress test."; }
};

export const generateGeometryDiagrams = async (statement: string): Promise<{ jsxGraph: string; asymptote: string }> => {
    const prompt = `
        For the following geometry problem:
        ${statement}

        1. Generate JSXGraph JavaScript code to render an interactive diagram. 
           - Assume a 'board' object is already created with id 'jxgbox'.
           - Use 'board.create(...)' to add points, lines, circles.
           - Try to make the construction dynamic (dependent points).
           - Do not wrap in a function, just provide the lines of code to add elements to 'board'.
           - Do NOT include \`const board = JXG.JSXGraph.initBoard...\` initialization.
        
        2. Generate Asymptote (asy) code for a static, high-quality printable diagram.

        Output Format:
        SPLIT_MARKER_JSX
        [JavaScript Code for board content only]
        SPLIT_MARKER_ASY
        [Asymptote Code]
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        
        const text = response.text || "";
        const parts = text.split("SPLIT_MARKER_ASY");
        
        let jsx = "";
        let asy = "";

        if (parts.length > 1) {
            jsx = parts[0].replace("SPLIT_MARKER_JSX", "").trim();
            asy = parts[1].trim();
        } else {
            jsx = "// Error parsing response";
            asy = "// Error parsing response";
        }

        // Cleanup fences
        jsx = jsx.replace(/```javascript/g, "").replace(/```js/g, "").replace(/```/g, "").trim();
        asy = asy.replace(/```asy/g, "").replace(/```/g, "").trim();

        return { jsxGraph: jsx, asymptote: asy };
    } catch (e) {
        return { jsxGraph: "", asymptote: "" };
    }
};