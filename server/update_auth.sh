#\!/bin/bash
TARGET_FILE="src/routes/team.routes.ts"

# チームルーターのすべての認証ミドルウェアを置換
sed -i '' 's/router\.get.*authenticate/router.get('\''\/'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.post.*authenticate/router.post('\''\/'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.get('\''\/\:teamId.*authenticate/router.get('\''\/\:teamId'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.put('\''\/\:teamId.*authenticate/router.put('\''\/\:teamId'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.delete('\''\/\:teamId.*authenticate/router.delete('\''\/\:teamId'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.get('\''\/\:teamId\/members.*authenticate/router.get('\''\/\:teamId\/members'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.post('\''\/\:teamId\/members.*authenticate/router.post('\''\/\:teamId\/members'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.put('\''\/\:teamId\/members\/\:userId\/role.*authenticate/router.put('\''\/\:teamId\/members\/\:userId\/role'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.delete('\''\/\:teamId\/members\/\:userId.*authenticate/router.delete('\''\/\:teamId\/members\/\:userId'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.get('\''\/\:teamId\/members\/\:userId\/card.*authenticate/router.get('\''\/\:teamId\/members\/\:userId\/card'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.get('\''\/\:teamId\/goal.*authenticate/router.get('\''\/\:teamId\/goal'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.post('\''\/\:teamId\/goal.*authenticate/router.post('\''\/\:teamId\/goal'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.put('\''\/\:teamId\/goal\/progress.*authenticate/router.put('\''\/\:teamId\/goal\/progress'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.get('\''\/\:teamId\/compatibility.*authenticate/router.get('\''\/\:teamId\/compatibility'\'' , hybridAuthenticate/g' $TARGET_FILE
sed -i '' 's/router\.get('\''\/\:teamId\/compatibility\/\:userId1\/\:userId2.*authenticate/router.get('\''\/\:teamId\/compatibility\/\:userId1\/\:userId2'\'' , hybridAuthenticate/g' $TARGET_FILE
