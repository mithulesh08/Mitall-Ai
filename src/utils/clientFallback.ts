/**
 * Client-Side Resilient Fallback Engine
 * Provides immediate responses if the backend serverless route is unreachable
 * (e.g. on pure static hosting like Vercel before serverless env vars are configured).
 */

export function generateClientFallback(prompt: string): string {
  const p = prompt.trim().toLowerCase();

  // Greetings
  if (p === 'hi' || p === 'hello' || p === 'hey' || p === 'ho' || p.startsWith('hi ') || p.startsWith('hello ')) {
    return `Hello! I am **MITALL**, your personal AI assistant. 

I am active and ready to help you with:
- **Coding & Algorithms**: Linked lists, QuickSort, trees, Python, TypeScript, SQL, and C++
- **Science & Mathematics**: Physics, calculus, formulas, and step-by-step problem solving
- **General Knowledge & Writing**: Explanations, brainstorming, and productivity

What would you like to explore or work on today?`;
  }

  // Linked list middle element
  if (p.includes('linked list') && (p.includes('middle') || p.includes('mid'))) {
    return `### Finding the Middle Element in a Linked List (Floyd's Tortoise and Hare)

The optimal approach uses **two pointers** moving at different speeds:
- \`slow\` moves **1 step** at a time.
- \`fast\` moves **2 steps** at a time.
When \`fast\` reaches the end of the list, \`slow\` will be precisely at the middle!

#### Python Implementation:
\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def find_middle_node(head: ListNode) -> ListNode:
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

# Example usage:
# List: 1 -> 2 -> 3 -> 4 -> 5
head = ListNode(1, ListNode(2, ListNode(3, ListNode(4, ListNode(5)))))
middle = find_middle_node(head)
print("Middle node value:", middle.val)  # Output: 3
\`\`\`

#### Complexity:
- **Time Complexity:** $O(N)$ — Single traversal of the linked list.
- **Space Complexity:** $O(1)$ — Only two pointer variables.

💡 *Tip: You can click "Run Sandbox" to test and run this directly inside MITALL's Coding Studio!*`;
  }

  // Factorial
  if (p.includes('factorial')) {
    return `### Factorial Calculation in Python

\`\`\`python
def factorial(n: int) -> int:
    """Calculates n! using recursion with base case n <= 1."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# Verification
for num in [5, 7, 10]:
    print(f"{num}! = {factorial(num)}")
\`\`\`

- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(N)$ for recursion call stack ($O(1)$ for iterative).`;
  }

  // Default helpful breakdown
  return `### MITALL AI Intelligence

Regarding **"${prompt.slice(0, 100)}"**:

I am currently running in **resilient client mode**. 

1. **Analysis & Core Idea**:
   To address this effectively, examine the underlying requirements, inputs, and desired outcome step by step.

2. **Practical Approach**:
   - Decompose into smaller logical stages.
   - Test edge cases and boundary conditions.
   - Optimize for clarity, performance, and maintainability.

*(Note: To connect full Gemini cloud streaming on your Vercel deployment at \`mitall-ai.vercel.app\`, ensure \`GEMINI_API_KEY\` is added to your Vercel Project Settings → Environment Variables.)*`;
}

/**
 * Direct Client-Side Gemini REST Streaming (Runs right inside browser if user provides API key)
 */
export async function streamDirectGeminiClient(
  prompt: string,
  apiKey: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  
  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: 'You are MITALL, an advanced general-purpose personal intelligence AI assistant for programming, science, mathematics, education, and creative writing. Always provide complete, working code and rigorous explanations.' }]
      }
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google API error (${res.status}): ${errorText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Response body not readable');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullText += text;
            onChunk(text);
          }
        } catch {}
      }
    }
  }

  return fullText;
}
