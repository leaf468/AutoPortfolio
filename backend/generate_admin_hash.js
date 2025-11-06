// Admin 계정 비밀번호 해시 생성 스크립트
const bcrypt = require('bcrypt');

const password = 'admin1234';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }

  console.log('\n=================================');
  console.log('Admin 계정 정보');
  console.log('=================================');
  console.log('이메일: admin@gmail.com');
  console.log('비밀번호: admin1234');
  console.log('비밀번호 해시:', hash);
  console.log('=================================\n');

  console.log('아래 SQL을 실행하세요:\n');
  console.log(`INSERT INTO users (email, password_hash, name, email_verified, is_active)`);
  console.log(`VALUES (`);
  console.log(`    'admin@gmail.com',`);
  console.log(`    '${hash}',`);
  console.log(`    'Admin',`);
  console.log(`    true,`);
  console.log(`    true`);
  console.log(`) ON CONFLICT (email) DO NOTHING;\n`);
});
