/**
 * Script to BULK CREATE Firebase Auth accounts from pre_registered_students
 * This will create actual Firebase Auth accounts so students can login immediately
 * 
 * Prerequisites:
 * 1. Node.js v20 or v18 (NOT v24)
 * 2. serviceAccountKey.json in project root
 * 3. Run: npm install firebase-admin
 * 
 * Usage: node scripts/bulk-create-accounts.cjs
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

// Check for service account file
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('\n📋 How to get it:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/hongson-cisa/settings/serviceaccounts/adminsdk');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the file as "serviceAccountKey.json" in the project root folder');
    console.log('4. Run this script again\n');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);
const auth = getAuth(app);

async function bulkCreateAccounts() {
    console.log('🚀 Starting bulk account creation...\n');

    try {
        // 1. Get all pre-registered students
        const preRegSnapshot = await db.collection('pre_registered_students').get();

        if (preRegSnapshot.empty) {
            console.log('❌ No pre-registered students found.');
            console.log('   Please import students first via CSV or add them manually.');
            process.exit(0);
        }

        console.log(`📊 Found ${preRegSnapshot.size} pre-registered students\n`);

        let createdCount = 0;
        let existsCount = 0;
        let errorCount = 0;

        for (const doc of preRegSnapshot.docs) {
            const data = doc.data();
            const studentId = data.studentId || doc.id;
            const email = `${studentId}@hongsoncisa.com`;
            const password = `hongsoncisa${studentId}`;

            try {
                // Check if user already exists
                let userRecord;
                try {
                    userRecord = await auth.getUserByEmail(email);
                    console.log(`⏭️  ${studentId}: Already exists (${data.firstName || 'No name'})`);
                    existsCount++;

                    // Update Firestore if needed
                    const userDocRef = db.collection('users').doc(userRecord.uid);
                    const userDoc = await userDocRef.get();

                    if (!userDoc.exists) {
                        // Create Firestore document if missing
                        await userDocRef.set({
                            uid: userRecord.uid,
                            email: email,
                            role: 'student',
                            studentId: studentId,
                            firstName: data.firstName || studentId,
                            lastName: data.lastName || '',
                            classRoom: data.classRoom || null,
                            createdAt: new Date()
                        });
                        console.log(`   ↳ Created missing Firestore document`);
                    } else {
                        // Update name if it's still just the studentId
                        const userData = userDoc.data();
                        if (userData.firstName === studentId && data.firstName) {
                            await userDocRef.update({
                                firstName: data.firstName,
                                lastName: data.lastName || '',
                                classRoom: data.classRoom || null
                            });
                            console.log(`   ↳ Updated name: ${data.firstName} ${data.lastName || ''}`);
                        }
                    }
                    continue;
                } catch (e) {
                    // User doesn't exist, create new one
                }

                // Create Firebase Auth user
                userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || studentId
                });

                // Create Firestore document
                await db.collection('users').doc(userRecord.uid).set({
                    uid: userRecord.uid,
                    email: email,
                    role: 'student',
                    studentId: studentId,
                    firstName: data.firstName || studentId,
                    lastName: data.lastName || '',
                    classRoom: data.classRoom || null,
                    createdAt: new Date()
                });

                console.log(`✅ ${studentId}: Created (${data.firstName || 'No name'} ${data.lastName || ''})`);
                createdCount++;

            } catch (error) {
                console.error(`❌ ${studentId}: Error - ${error.message}`);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Summary:');
        console.log(`   ✅ Created: ${createdCount}`);
        console.log(`   ⏭️  Already existed: ${existsCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('='.repeat(50));

        if (createdCount > 0) {
            console.log('\n🎉 Success! Students can now login with:');
            console.log('   Email: [รหัสนักเรียน]@hongsoncisa.com');
            console.log('   Password: hongsoncisa[รหัสนักเรียน]');
            console.log('\n   Or just enter their Student ID on the login page.');
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
    }

    process.exit(0);
}

bulkCreateAccounts();
