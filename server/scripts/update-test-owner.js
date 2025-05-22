require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyfortune';

mongoose.connect(uri).then(async () => {
  console.log('MongoDB接続成功');
  try {
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const OrganizationSchema = new mongoose.Schema({}, { strict: false });
    
    const User = mongoose.model('User', UserSchema);
    const Organization = mongoose.model('Organization', OrganizationSchema);
    
    // テスト用SuperAdminの存在を確認
    const superAdmin = await User.findOne({ email: 'superadmin_test@example.com' });
    console.log('SuperAdmin:', superAdmin ? {
      id: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role
    } : 'Not found');
    
    // オーナーと組織を取得
    const owner = await User.findOne({ email: 'test-owner@example.com' });
    const org = await Organization.findOne({ name: 'Test Organization' });
    
    if (!owner) {
      console.log('オーナーが見つかりません');
      return;
    }
    
    if (!org) {
      console.log('組織が見つかりません');
      return;
    }
    
    console.log('オーナー:', {
      id: owner._id.toString(),
      email: owner.email
    });
    
    console.log('組織:', {
      id: org._id.toString(),
      name: org.name
    });
    
    // オーナーユーザーに組織IDを紐付け
    await User.updateOne(
      { _id: owner._id }, 
      { $set: { organizationId: org._id } }
    );
    
    // 更新後の確認
    const updatedOwner = await User.findOne({ email: 'test-owner@example.com' });
    
    console.log('オーナー更新完了:', {
      id: updatedOwner._id.toString(),
      email: updatedOwner.email,
      role: updatedOwner.role,
      organizationId: updatedOwner.organizationId ? updatedOwner.organizationId.toString() : 'undefined'
    });
    
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB切断完了');
  }
}).catch(err => console.error('MongoDB接続エラー:', err));