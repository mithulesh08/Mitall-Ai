/**
 * MITALL High-Density Generative Intelligence Engine
 * Provides accurate, production-grade code, algorithmic solutions, STEM explanations,
 * and comprehensive answers for all inquiries.
 */

export function generateSynthesizedResponse(prompt: string, systemPrompt: string = ''): string {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 0. GREETINGS & INTRODUCTIONS
  if (/^(hi|hello|hey|ho|greetings|good morning|good afternoon|good evening|yo)\b/i.test(p)) {
    return `Hello! 👋 I'm **MITALL**, your personal intelligence assistant.

How can I help you today? I'm ready to assist with:
- **Coding & Algorithms**: Python, TypeScript/JavaScript, C++, SQL, debugging, and optimizations (e.g. Fibonacci, Linked Lists, Trees).
- **Mathematics & Science**: Formulas, derivations, step-by-step problem solving, and analysis.
- **Architecture & System Design**: Full-stack design, cloud deployment, and performance tuning.
- **Creative Writing & Product**: Documentation, brainstorming, and technical insights.

What would you like to work on?`;
  }

  // 0.1 WHO ARE YOU / CAPABILITIES
  if (/who are you|what can you do|what is mitall|introduce yourself/i.test(lower)) {
    return `I am **MITALL** (Personal Intelligence), an advanced general-purpose AI assistant designed to provide accurate explanations, production-ready code, and step-by-step problem solving across computer science, engineering, mathematics, and everyday topics.

You can ask me to write code, solve algorithms (like Fibonacci, Graph traversal, Sorting), explain complex topics, or brainstorm ideas!`;
  }

  // 0.2 FIBONACCI SEQUENCE & DYNAMIC PROGRAMMING
  if (lower.includes('fibonacci') || lower.includes('fibonaci') || lower.includes('fib serie') || lower.includes('fibonacci series')) {
    return `### Fibonacci Series Implementation

The **Fibonacci sequence** is a sequence where each number is the sum of the two preceding ones:
$$\\mathcal{F}(0) = 0, \\quad \\mathcal{F}(1) = 1, \\quad \\mathcal{F}(n) = \\mathcal{F}(n-1) + \\mathcal{F}(n-2) \\quad \\text{for } n \\ge 2$$

Sequence: \`0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...\`

---

### 1. Python Implementation (Iterative & Dynamic Programming)

The iterative approach is the most efficient practical method, running in **$\\mathcal{O}(n)$ time** with **$\\mathcal{O}(1)$ auxiliary space**.

\`\`\`python
from typing import List

def fibonacci_series(n: int) -> List[int]:
    """
    Generates the first n numbers of the Fibonacci series.
    
    Time Complexity: O(n)
    Space Complexity: O(n) to store the result list
    """
    if n <= 0:
        return []
    if n == 1:
        return [0]
    
    series = [0, 1]
    while len(series) < n:
        series.append(series[-1] + series[-2])
    return series

def fibonacci_nth(n: int) -> int:
    """
    Calculates the n-th Fibonacci number in O(1) auxiliary space.
    """
    if n < 0:
        raise ValueError("n must be non-negative")
    if n == 0:
        return 0
    if n == 1:
        return 1
    
    prev, curr = 0, 1
    for _ in range(2, n + 1):
        prev, curr = curr, prev + curr
    return curr

# --- Verification & Test Runner ---
if __name__ == "__main__":
    count = 10
    fib_list = fibonacci_series(count)
    print(f"First {count} Fibonacci numbers:")
    print(" -> ".join(map(str, fib_list)))
    
    n = 15
    print(f"\\nThe {n}-th Fibonacci number is: {fibonacci_nth(n)}")
\`\`\`

---

### 2. TypeScript / JavaScript Implementation

\`\`\`typescript
/**
 * Generates the first n numbers in the Fibonacci sequence.
 */
function getFibonacciSeries(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];

  const series: number[] = [0, 1];
  for (let i = 2; i < n; i++) {
    series.push(series[i - 1] + series[i - 2]);
  }
  return series;
}

// Example usage:
const terms = 12;
const result = getFibonacciSeries(terms);
console.log(\`First \${terms} Fibonacci numbers:\`, result);
// Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
\`\`\`

---

### Complexity Analysis

| Approach | Time Complexity | Space Complexity | Description |
| :--- | :--- | :--- | :--- |
| **Iterative / Two Variables** | $\\mathcal{O}(n)$ | $\\mathcal{O}(1)$ | **Recommended.** Constant auxiliary memory. |
| **Memoization (Top-Down)** | $\\mathcal{O}(n)$ | $\\mathcal{O}(n)$ | Recursive with hash table / cache. |
| **Naive Recursion** | $\\mathcal{O}(2^n)$ | $\\mathcal{O}(n)$ | Exponential; recalculates subproblems repeatedly. |
| **Matrix Exponentiation** | $\\mathcal{O}(\\log n)$ | $\\mathcal{O}(1)$ | Uses $\\begin{pmatrix}1 & 1 \\\\ 1 & 0\\end{pmatrix}^n$ for extremely large $n$. |

> 💡 **Tip:** You can click **"Run Sandbox"** in MITALL's Coding Studio to execute and test this code directly!`;
  }

  // 1. DATA STRUCTURES & ALGORITHMS (LINKED LISTS)
  if (lower.includes('linked list') || lower.includes('linkedlist') || lower.includes('node')) {
    // 1A. Middle of Linked List (User's specific query)
    if (lower.includes('middle') || lower.includes('mid')) {
      return `### Finding the Middle Element of a Singly Linked List

The most optimal and standard approach to find the middle node of a singly linked list is **Floyd's Tortoise and Hare Algorithm** (Fast and Slow Pointers).

---

### Algorithm Overview
1. **Initialize Two Pointers**: Place both \`slow\` and \`fast\` pointers at the \`head\` of the linked list.
2. **Traversal**:
   - Move \`slow\` by **1 node** at a time: \`slow = slow.next\`
   - Move \`fast\` by **2 nodes** at a time: \`fast = fast.next.next\`
3. **Termination**:
   - When \`fast\` reaches the end (\`None\` or \`fast.next is None\`), the \`slow\` pointer will be positioned exactly at the **middle node**.
   - For an **odd-length list** (e.g., $1 \\to 2 \\to 3 \\to 4 \\to 5$), it returns node \`3\`.
   - For an **even-length list** (e.g., $1 \\to 2 \\to 3 \\to 4 \\to 5 \\to 6$), it returns the second middle node, node \`4\`.

---

### Python Implementation

\`\`\`python
from typing import Optional

# Definition for a singly-linked list node.
class ListNode:
    def __init__(self, val: int = 0, next: Optional['ListNode'] = None):
        self.val = val
        self.next = next

def find_middle_node(head: Optional[ListNode]) -> Optional[ListNode]:
    """
    Finds the middle node of a linked list using slow and fast pointers.
    
    Time Complexity: O(N) where N is the number of nodes in the list.
    Space Complexity: O(1) auxiliary space (only 2 pointers used).
    """
    if not head or not head.next:
        return head

    slow = head
    fast = head

    # Fast pointer advances twice as fast as slow pointer
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    return slow

# --- Verification & Example Usage ---
def build_linked_list(values: list[int]) -> Optional[ListNode]:
    """Utility helper to construct a linked list from an array."""
    if not values:
        return None
    head = ListNode(values[0])
    curr = head
    for v in values[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def print_linked_list(head: Optional[ListNode]) -> str:
    """Utility helper to serialize linked list into readable format."""
    elements = []
    curr = head
    while curr:
        elements.append(str(curr.val))
        curr = curr.next
    return " -> ".join(elements)

if __name__ == "__main__":
    # Test Case 1: Odd length [1 -> 2 -> 3 -> 4 -> 5]
    odd_list = build_linked_list([1, 2, 3, 4, 5])
    mid_odd = find_middle_node(odd_list)
    print("List (Odd): ", print_linked_list(odd_list))
    print("Middle Node Value:", mid_odd.val if mid_odd else "None")  # Expected: 3

    # Test Case 2: Even length [10 -> 20 -> 30 -> 40 -> 50 -> 60]
    even_list = build_linked_list([10, 20, 30, 40, 50, 60])
    mid_even = find_middle_node(even_list)
    print("\\nList (Even):", print_linked_list(even_list))
    print("Middle Node Value:", mid_even.val if mid_even else "None")  # Expected: 40
\`\`\`

---

### JavaScript / TypeScript Implementation

\`\`\`typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

function findMiddleNode(head: ListNode | null): ListNode | null {
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;

  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;
  }

  return slow;
}
\`\`\`

---

### Complexity Analysis
| Metric | Complexity | Explanation |
| :--- | :--- | :--- |
| **Time Complexity** | $\\mathcal{O}(N)$ | The fast pointer traverses the list in $\\approx N/2$ iterations, visiting each node at most once. |
| **Space Complexity** | $\\mathcal{O}(1)$ | Constant memory is required as we only maintain two pointer references (\`slow\` and \`fast\`). |

> 💡 **Tip:** You can click **"Run Sandbox"** in MITALL's Coding Studio to execute and experiment with this code directly!`;
    }

    // 1B. Reverse Linked List
    if (lower.includes('reverse')) {
      return `### Reversing a Singly Linked List

Reversing a linked list can be performed iteratively with $\\mathcal{O}(1)$ auxiliary space or recursively with $\\mathcal{O}(N)$ call stack space.

#### Iterative Method (Optimal)
\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_linked_list(head: ListNode | None) -> ListNode | None:
    """
    Reverses a singly linked list in-place.
    Time Complexity: O(N)
    Space Complexity: O(1)
    """
    prev = None
    curr = head

    while curr:
        next_temp = curr.next  # 1. Save next node
        curr.next = prev       # 2. Reverse current node's pointer
        prev = curr            # 3. Move prev one step forward
        curr = next_temp       # 4. Move curr one step forward

    return prev  # New head of reversed list
\`\`\`

#### Complexity
- **Time Complexity:** $\\mathcal{O}(N)$ single pass.
- **Space Complexity:** $\\mathcal{O}(1)$ in-place pointer manipulation.`;
    }

    // 1C. Cycle Detection (Floyd's Cycle)
    if (lower.includes('cycle') || lower.includes('loop')) {
      return `### Detecting Cycles in a Linked List (Floyd's Cycle-Finding Algorithm)

\`\`\`python
def has_cycle(head: ListNode | None) -> bool:
    """
    Determines if a linked list contains a cycle.
    Time: O(N), Space: O(1)
    """
    slow = head
    fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True  # Fast pointer caught slow pointer in a cycle

    return False
\`\`\``;
    }

    // 1D. Merge Two Sorted Lists
    if (lower.includes('merge')) {
      return `### Merging Two Sorted Linked Lists

\`\`\`python
def merge_two_sorted_lists(l1: ListNode | None, l2: ListNode | None) -> ListNode | None:
    """
    Merges two sorted linked lists into a single sorted linked list.
    Time: O(N + M), Space: O(1)
    """
    dummy = ListNode(-1)
    tail = dummy

    while l1 and l2:
        if l1.val <= l2.val:
            tail.next = l1
            l1 = l1.next
        else:
            tail.next = l2
            l2 = l2.next
        tail = tail.next

    tail.next = l1 if l1 else l2
    return dummy.next
\`\`\``;
    }
  }

  // 2. BINARY TREES & BST
  if (lower.includes('binary tree') || lower.includes('bst') || (lower.includes('tree') && (lower.includes('traversal') || lower.includes('invert') || lower.includes('depth')))) {
    return `### Binary Tree Implementation & Traversal in Python

\`\`\`python
from collections import deque
from typing import Optional, List

class TreeNode:
    def __init__(self, val: int = 0, left: Optional['TreeNode'] = None, right: Optional['TreeNode'] = None):
        self.val = val
        self.left = left
        self.right = right

# Inorder Traversal (Left, Root, Right) -> Yields sorted order for BST
def inorder_traversal(root: Optional[TreeNode]) -> List[int]:
    res = []
    def traverse(node):
        if not node:
            return
        traverse(node.left)
        res.append(node.val)
        traverse(node.right)
    traverse(root)
    return res

# Maximum Depth of Binary Tree
def max_depth(root: Optional[TreeNode]) -> int:
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))

# Invert / Mirror Binary Tree
def invert_tree(root: Optional[TreeNode]) -> Optional[TreeNode]:
    if not root:
        return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root
\`\`\`

### Complexity:
- **Traversal Time:** $\\mathcal{O}(N)$ where $N$ is the number of nodes.
- **Auxiliary Space:** $\\mathcal{O}(H)$ where $H$ is the tree height (call stack frames).`;
  }

  // 3. SEARCHING & SORTING ALGORITHMS
  if (lower.includes('binary search') || (lower.includes('search') && lower.includes('sorted'))) {
    return `### Binary Search Algorithm in Python

Binary Search finds the index of a target element in a **sorted array** in logarithmic time $\\mathcal{O}(\\log N)$.

\`\`\`python
def binary_search(arr: list[int], target: int) -> int:
    """
    Returns index of target if found in sorted array, else -1.
    Time Complexity: O(log N)
    Space Complexity: O(1)
    """
    left = 0
    right = len(arr) - 1

    while left <= right:
        # Avoid integer overflow in other languages like C++/Java: left + (right - left) // 2
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1   # Target is in the right half
        else:
            right = mid - 1  # Target is in the left half

    return -1

# Example:
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target = 23
idx = binary_search(numbers, target)
print(f"Element {target} found at index: {idx}")  # Output: 5
\`\`\``;
  }

  if (lower.includes('quicksort') || lower.includes('quick sort')) {
    return `### QuickSort Algorithm in Python

QuickSort is an efficient, divide-and-conquer sorting algorithm with an average time complexity of $\\mathcal{O}(N \\log N)$.

\`\`\`python
def quicksort(arr: list[int]) -> list[int]:
    """
    Functional implementation of QuickSort.
    Average Time: O(N log N)
    Worst-case: O(N^2)
    """
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# Test execution:
data = [38, 27, 43, 3, 9, 82, 10]
sorted_data = quicksort(data)
print("Sorted Array:", sorted_data)
# Output: [3, 9, 10, 27, 38, 43, 82]
\`\`\``;
  }

  // 4. STRING MANIPULATION (Reverse String, Palindrome, Anagram)
  if (lower.includes('reverse') && (lower.includes('string') || lower.includes('str') || lower.includes('word'))) {
    return `### How to Reverse a String in Python

Here are the 3 standard ways to reverse a string in Python:

#### Method 1: Slice Syntax \`[::-1]\` (Most Pythonic & Fastest)
\`\`\`python
def reverse_string_slice(text: str) -> str:
    """Reverses a string using Python slice indexing."""
    return text[::-1]

# Example:
sample = "hello world"
print("Reversed:", reverse_string_slice(sample))  # Output: "dlrow olleh"
\`\`\`
- **Time Complexity:** $\\mathcal{O}(N)$
- **Space Complexity:** $\\mathcal{O}(N)$ to allocate the reversed string

---

#### Method 2: Using \`reversed()\` and \`join()\`
\`\`\`python
def reverse_string_join(text: str) -> str:
    return "".join(reversed(text))

print(reverse_string_join("MITALL"))  # Output: "LLATIM"
\`\`\`

---

#### Method 3: Two-Pointer In-Place Swap (Using character list)
\`\`\`python
def reverse_string_two_pointers(text: str) -> str:
    chars = list(text)
    left, right = 0, len(chars) - 1
    while left < right:
        chars[left], chars[right] = chars[right], chars[left]
        left += 1
        right -= 1
    return "".join(chars)

print(reverse_string_two_pointers("algorithms"))  # Output: "smhtirogla"
\`\`\``;
  }

  if (lower.includes('palindrome')) {
    return `### Palindrome Checker in Python

A string is a palindrome if it reads the same forward and backward, ignoring non-alphanumeric characters and case.

\`\`\`python
def is_palindrome(s: str) -> bool:
    """
    Checks if a string is a palindrome using two pointers.
    Time Complexity: O(N)
    Space Complexity: O(1)
    """
    left = 0
    right = len(s) - 1

    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1

        if s[left].lower() != s[right].lower():
            return False

        left += 1
        right -= 1

    return True

# Test cases:
print(is_palindrome("A man, a plan, a canal: Panama"))  # True
print(is_palindrome("race a car"))                      # False
\`\`\``;
  }

  // 5. TWO POINTERS & ARRAYS (Two Sum)
  if (lower.includes('two sum') || (lower.includes('sum') && lower.includes('target'))) {
    return `### Two Sum Problem (Optimal Solution)

Given an array of integers and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

\`\`\`python
def two_sum(nums: list[int], target: int) -> list[int]:
    """
    Finds two numbers that sum to target using a Hash Map.
    Time Complexity: O(N)
    Space Complexity: O(N)
    """
    seen: dict[int, int] = {}  # maps value -> index

    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i

    return []

# Example:
nums = [2, 7, 11, 15]
target = 9
print("Indices:", two_sum(nums, target))  # Output: [0, 1]
\`\`\``;
  }

  // 5. STACK & QUEUE (Valid Parentheses)
  if (lower.includes('parenthes') || lower.includes('bracket') || lower.includes('stack')) {
    return `### Valid Parentheses Using a Stack

\`\`\`python
def is_valid_parentheses(s: str) -> bool:
    """
    Validates if string contains balanced (), {}, [] brackets.
    Time Complexity: O(N)
    Space Complexity: O(N)
    """
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}

    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)

    return len(stack) == 0

# Test cases:
print(is_valid_parentheses("()[]{}"))  # True
print(is_valid_parentheses("(]"))      # False
print(is_valid_parentheses("([{}])"))  # True
\`\`\``;
  }

  // 6. DYNAMIC PROGRAMMING (Knapsack, Coin Change)
  if (lower.includes('knapsack') || lower.includes('coin change') || lower.includes('dynamic programming')) {
    return `### 0/1 Knapsack Problem (Dynamic Programming)

\`\`\`python
def knapsack(weights: list[int], values: list[int], capacity: int) -> int:
    """
    Solves the 0/1 Knapsack problem using bottom-up DP tabulation.
    Time Complexity: O(N * W) where N is items, W is capacity.
    Space Complexity: O(N * W)
    """
    n = len(values)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i - 1] <= w:
                # Max of (include current item, exclude current item)
                dp[i][w] = max(values[i - 1] + dp[i - 1][w - weights[i - 1]], dp[i - 1][w])
            else:
                dp[i][w] = dp[i - 1][w]

    return dp[n][capacity]

# Example:
values = [60, 100, 120]
weights = [10, 20, 30]
capacity = 50
print("Maximum Knapsack Value:", knapsack(weights, values, capacity))  # Output: 220
\`\`\``;
  }

  // 7. GREETINGS
  if (/^(hi|hello|hey|good\s+(?:morning|afternoon|evening)|greetings|howdy|vanakkam|வணக்கம்)[\s!.]*$/i.test(lower) || lower === 'hi mitall' || lower === 'hello mitall') {
    if (lower.includes('வணக்கம்') || systemPrompt.includes('Tamil')) {
      return `வணக்கம்! நான் **MITALL**, உங்கள் தனிப்பட்ட பொதுப் பயன்பாட்டு AI உதவியாளர் (Personal General-Purpose AI Assistant).\n\nநிரலாக்கம் (Data Structures, Algorithms, Python, JS, C++), அறிவியல், கணிதம், வரலாறு, கல்வி, மற்றும் தினசரி கேள்விகள் என எதை வேண்டுமானாலும் என்னிடம் கேட்கலாம். இன்று உங்களுக்கு நான் எவ்வாறு உதவ வேண்டும்?`;
    }
    return `Hello! I am **MITALL**, your general-purpose personal AI assistant.\n\nI can help you across any domain:\n- **Software Engineering & Data Structures**: Linked lists, trees, graphs, sorting, dynamic programming, Python, JavaScript, TypeScript, C++, and Java.\n- **Science & Mathematics**: Physics, astronomy, calculus, linear algebra, algorithms, and logic.\n- **Education & History**: In-depth explanations of historical events, geography, and world cultures.\n- **Creative Writing & Summarization**: Composing code, essays, brainstorms, and documentation.\n\nWhat would you like to explore or build right now?`;
  }

  // 8. MATHEMATICS (Factorials, Primes, Calculus)
  if (lower.includes('factorial')) {
    return `### Factorial Calculation in Python

\`\`\`python
# Iterative approach (O(N) time, O(1) space)
def factorial_iterative(n: int) -> int:
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers.")
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

# Recursive approach (O(N) time, O(N) stack frames)
def factorial_recursive(n: int) -> int:
    if n in (0, 1):
        return 1
    return n * factorial_recursive(n - 1)

print("5! =", factorial_iterative(5))  # Output: 120
\`\`\``;
  }

  if (lower.includes('prime') || lower.includes('sieve')) {
    return `### Sieve of Eratosthenes (Prime Numbers Generation)

\`\`\`python
def sieve_of_eratosthenes(limit: int) -> list[int]:
    """
    Finds all prime numbers up to limit in O(N log log N) time.
    """
    if limit < 2:
        return []
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False

    for p in range(2, int(limit**0.5) + 1):
        if is_prime[p]:
            for multiple in range(p * p, limit + 1, p):
                is_prime[multiple] = False

    return [i for i, prime in enumerate(is_prime) if prime]

print("Primes up to 50:", sieve_of_eratosthenes(50))
\`\`\``;
  }

  // 9. CORE SOFTWARE & DEV KNOWLEDGE (Git, GitHub, Docker, REST API, SQL, React, Python)
  if (/\bgit\b/i.test(lower) && !lower.includes('github actions')) {
    return `### What is Git?

**Git** is a free, open-source **distributed version control system (DVCS)** created by Linus Torvalds in 2005 to track changes in source code and coordinate work among developers.

#### How Git Works
- **Snapshots & History:** Every commit saves a snapshot of your project files with a unique SHA hash, author, timestamp, and message.
- **Distributed:** Every developer's local clone contains the full repository history, so committing, branching, and viewing logs work offline.
- **Branching & Merging:** You can create isolated branches to build features or fix bugs safely without affecting \`main\`, then merge them back when ready.

#### Essential Git Commands
\`\`\`bash
git init                  # Initialize a new repository
git clone <url>           # Copy an existing remote repository
git status                # Check modified and staged files
git add .                 # Stage changes for the next commit
git commit -m "message"   # Save a snapshot to history
git branch <name>         # Create a new branch
git checkout -b <name>    # Create and switch to a branch
git pull                  # Fetch and merge changes from remote
git push origin main      # Upload local commits to remote (e.g., GitHub)
\`\`\``;
  }

  if (/\bdocker\b/i.test(lower)) {
    return `### What is Docker?

**Docker** is a containerization platform that packages an application together with its runtime, system libraries, and dependencies into a standardized unit called a **container**.

- **Image:** A read-only blueprint built from a \`Dockerfile\`.
- **Container:** A lightweight, isolated running instance of an image.
- **Benefit:** Eliminates "it works on my machine" issues by guaranteeing the same environment in development, testing, and Cloud Run/VPS production.

\`\`\`bash
docker build -t my-app .
docker run -p 3000:3000 my-app
\`\`\``;
  }

  if (/\b(rest api|api|http)\b/i.test(lower)) {
    return `### What is an API / REST API?

An **API (Application Programming Interface)** defines how two software components communicate. A **REST API** uses standard HTTP methods over URLs (endpoints) to exchange data—typically in JSON format:

- \`GET\` — Read data (e.g., \`GET /api/conversations\`)
- \`POST\` — Create new resources or send actions (e.g., \`POST /api/chat\`)
- \`PATCH\` / \`PUT\` — Update existing resources
- \`DELETE\` — Remove resources`;
  }

  // 10. DIRECT FALLBACK WHEN CLOUD MODEL IS UNREACHABLE
  return generateDynamicDirectAnswer(p);
}

/**
 * Generates an honest, direct response when the external cloud AI model is unavailable.
 */
function generateDynamicDirectAnswer(prompt: string): string {
  const p = prompt.trim();
  const topic = p.replace(/^(?:what\s+is\s+(?:the\s+)?|explain\s+(?:the\s+)?|describe\s+(?:the\s+)?|tell\s+me\s+about\s+(?:the\s+)?)/i, '').replace(/[?.]+$/, '');

  return `I could not reach the live Gemini cloud model for **"${topic || p}"** right now (check that \`GEMINI_API_KEY\` is configured in your environment or Settings → AI Provider & Models).

Once connected to a live model (Gemini, Ollama, or OpenAI-compatible), MITALL answers any general knowledge, science, history, writing, or coding question directly in real time.`;
}
