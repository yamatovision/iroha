#\!/bin/bash
TARGET_FILE="src/routes/admin.routes.ts"

# 認証ミドルウェアの置換
sed -i '' 's/authenticate,/hybridAuthenticate,/g' $TARGET_FILE
sed -i '' 's/requireSuperAdmin,/hybridRequireSuperAdmin,/g' $TARGET_FILE
