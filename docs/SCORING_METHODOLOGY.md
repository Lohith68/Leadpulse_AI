# LEADPULSE AI – Transparent 100-Point Lead Scoring Methodology

## 1. Executive Formulation
The **LEADPULSE AI** Lead Scoring Engine utilizes an explainable, deterministic 100-point composite scoring model. Unlike black-box neural networks, every point is attributable to specific verified attributes and behavioral signals, enabling auditable SLA enforcement and territory routing.

$$\text{Total Score} = \min(100, \text{Fit Score} + \text{Intent Score} + \text{Engagement Score})$$

---

## 2. Component Scoring Breakdown

### A. Company & Persona Fit Score (Maximum 30 Points)
Measures alignment between the prospective account/contact and Ideal Customer Profiles (ICP).

| Rule ID | Attribute Dimension | Evaluation Criteria | Awarded Points |
|---|---|---|---|
| `RULE-FIT-01` | Enterprise Size | `Company.employeeCount >= 500` or `size IN ('501-1000', '1000+')` | **+10 Pts** |
| `RULE-FIT-02` | Mid-Market Size | `Company.employeeCount BETWEEN 51 AND 499` | **+5 Pts** |
| `RULE-FIT-03` | Target Vertical | `Company.industry IN ('Technology', 'Healthcare', 'Financial Services')` | **+10 Pts** |
| `RULE-FIT-04` | Secondary Vertical | `Company.industry IN ('Manufacturing', 'Telecommunications', 'Energy')` | **+5 Pts** |
| `RULE-FIT-05` | Decision-Maker Role | `Contact.roleLevel IN ('C-Level', 'VP')` | **+5 Pts** |
| `RULE-FIT-06` | Influencer Role | `Contact.roleLevel IN ('Director', 'Manager')` | **+3 Pts** |
| `RULE-FIT-07` | Geographic Territory | `Company.territory IN ('North America', 'EMEA', 'APAC')` | **+5 Pts** |

*Maximum sub-score cap:* $\text{Fit Score} = \min(30, \sum \text{Awarded Fit Points})$.

---

### B. High-Intent Touchpoint Score (Maximum 40 Points)
Measures active commercial procurement and buying signals.

| Rule ID | Behavioral Touchpoint | Event Evaluation Criteria | Awarded Points |
|---|---|---|---|
| `RULE-INT-01` | Direct Demo Request | Inbound activity `DEMO_REQUEST` logged | **+15 Pts** |
| `RULE-INT-02` | Commercial Pricing View | Activity `PRICING_PAGE_VIEW` logged | **+10 Pts** |
| `RULE-INT-03` | Technical RFQ / Inquiry | Activity `PRODUCT_INQUIRY` logged | **+10 Pts** |
| `RULE-INT-04` | Formal Purchase Intent Form | Activity `PURCHASE_INTENT_FORM` submitted | **+10 Pts** |

*Maximum sub-score cap:* $\text{Intent Score} = \min(40, \sum \text{Awarded Intent Points})$.

---

### C. Engagement & Recency Score (Maximum 30 Points)
Measures prospect responsiveness, marketing touchpoint frequency, and recency of interest.

| Rule ID | Engagement Behavior | Evaluation Criteria | Awarded Points |
|---|---|---|---|
| `RULE-ENG-01` | Active Email Clickthrough | Activity `EMAIL_CLICK` logged within 30 days | **+10 Pts** |
| `RULE-ENG-02` | Passive Email Open | Activity `EMAIL_OPEN` logged | **+5 Pts** |
| `RULE-ENG-03` | Frequent Web Sessions | $\ge 3$ `WEBSITE_VISIT` activities logged | **+10 Pts** |
| `RULE-ENG-04` | Event / Webinar Attendance | Activity `EVENT_ATTENDANCE` logged | **+10 Pts** |
| `RULE-ENG-05` | Active Recency | `lastActivityAt >= NOW() - 14 Days` | **+5 Pts** |

*Maximum sub-score cap:* $\text{Engagement Score} = \min(30, \sum \text{Awarded Engagement Points})$.

---

## 3. Score Tiers & Operational Routing SLA

| Score Range | Category | Operational SLA Routing | Priority Tier |
|---|---|---|---|
| **80 – 100 Points** | `HOT` | Automatic rep routing, **1-Day SLA Task** (`URGENT_1_DAY`), instant executive alert. | Tier 1 (Urgent) |
| **50 – 79 Points** | `WARM` | Territory rep assignment, **3-Day SLA Task** (`HIGH_3_DAY`), nurture campaign. | Tier 2 (High) |
| **0 – 49 Points** | `COLD` | Automated digital marketing nurture, **7-Day SLA Task** (`NORMAL_NURTURE`). | Tier 3 (Nurture) |

---

## 4. Strict Temporal Leakage Protection
A critical failure mode in predictive CRM systems is **temporal data leakage**—scoring a lead based on activities that occurred *after* the lead was already converted to an opportunity or closed.

### Anti-Leakage Invariant Rules:
1. **Conversion Freeze Horizon:** When evaluating activities for a lead with `conversionStatus = 'CONVERTED'`, any activity where:
   $$\text{Activity.createdAt} > \text{Lead.convertedAt}$$
   must be flagged with `isPostConversion = true` and **strictly excluded** from `intentScore`, `engagementScore`, and `totalScore`.
2. **Point-in-Time Traceability:** Historical scoring audits evaluate only records existing prior to `scoringTimestamp`.
3. **Negative Anomaly Scenario 2:** Injected deliberately to test compliance sentinels. Any system run where post-conversion points are credited to pre-conversion scores flags `POST_CONVERSION_ACTIVITY_USED_IN_SCORE`.

---

## 5. High-Scoring Non-Converter Calibrations
To prevent unrealistic synthetic over-fitting where 100% of `HOT` leads convert to opportunities, the dataset explicitly calibrates:
- **Hot Lead Volume:** ~20% of generated leads achieve `HOT` scores (&ge;80).
- **Non-Converter Ratio:** At least 25% of `HOT` leads remain in `QUALIFIED` or `CONTACTED` states without an associated opportunity. This mirrors real enterprise dynamics where budget freezes, competitive losses, or timing issues prevent deal closure despite high interest.
