#!/bin/bash
# categoryBasedRecommendationService.ts
sed -i '' 's/cl\.specific_info\.match/(cl.specific_info || cl.user_spec || "").match/g' categoryBasedRecommendationService.ts
# coverLetterAnalysisService.ts  
sed -i '' '3,15s/category: string;/category?: string;\n  categories?: string;\n  specific_info?: string;\n  user_spec?: string;/' coverLetterAnalysisService.ts
sed -i '' 's/cl\.specific_info\.match/(cl.specific_info || cl.user_spec || "").match/g' coverLetterAnalysisService.ts
# portfolioRecommendationService.ts
sed -i '' 's/cl\.specific_info\.match/(cl.specific_info || cl.user_spec || "").match/g' portfolioRecommendationService.ts
sed -i '' 's/(cl\.specific_info || "")/((cl.specific_info || cl.user_spec) || "")/g' portfolioRecommendationService.ts
# positionStatsService.ts
sed -i '' 's/cl\.specific_info || ""/cl.specific_info || cl.user_spec || ""/g' positionStatsService.ts
