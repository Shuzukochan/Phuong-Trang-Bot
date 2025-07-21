const { getFirestore } = require('./firebase');

class FirebaseModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.db = getFirestore();
    }

    // Tìm một document theo điều kiện
    async findOne(query) {
        try {
            const collection = this.db.collection(this.collectionName);
            let queryRef = collection;

            // Áp dụng các điều kiện query
            for (const [field, value] of Object.entries(query)) {
                queryRef = queryRef.where(field, '==', value);
            }

            const snapshot = await queryRef.limit(1).get();
            
            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error(`Error finding document in ${this.collectionName}:`, error);
            throw error;
        }
    }

    // Tìm nhiều documents theo điều kiện
    async find(query = {}) {
        try {
            const collection = this.db.collection(this.collectionName);
            let queryRef = collection;

            // Áp dụng các điều kiện query
            for (const [field, value] of Object.entries(query)) {
                queryRef = queryRef.where(field, '==', value);
            }

            const snapshot = await queryRef.get();
            const results = [];

            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return results;
        } catch (error) {
            console.error(`Error finding documents in ${this.collectionName}:`, error);
            throw error;
        }
    }

    // Cập nhật hoặc tạo document mới (upsert)
    async updateOne(query, updateData, options = {}) {
        try {
            const { $set, $push, $pull, $inc } = updateData;
            const { upsert = false } = options;

            // Tìm document hiện có
            const existingDoc = await this.findOne(query);

            if (!existingDoc && !upsert) {
                return { modifiedCount: 0 };
            }

            let docRef;
            let finalData = {};

            if (existingDoc) {
                docRef = this.db.collection(this.collectionName).doc(existingDoc.id);
                finalData = { ...existingDoc };
                delete finalData.id; // Xóa id khỏi data để tránh lưu trùng
            } else {
                docRef = this.db.collection(this.collectionName).doc();
                finalData = { ...query }; // Khởi tạo với query conditions
            }

            // Xử lý $set operations
            if ($set) {
                Object.assign(finalData, $set);
            }

            // Xử lý $inc operations
            if ($inc) {
                for (const [field, value] of Object.entries($inc)) {
                    finalData[field] = (finalData[field] || 0) + value;
                }
            }

            // Xử lý $push operations
            if ($push) {
                for (const [field, value] of Object.entries($push)) {
                    if (!finalData[field]) {
                        finalData[field] = [];
                    }
                    if (Array.isArray(finalData[field])) {
                        finalData[field].push(value);
                    }
                }
            }

            // Xử lý $pull operations
            if ($pull) {
                for (const [field, condition] of Object.entries($pull)) {
                    if (Array.isArray(finalData[field])) {
                        if (typeof condition === 'object') {
                            // Xử lý điều kiện phức tạp
                            finalData[field] = finalData[field].filter(item => {
                                for (const [key, value] of Object.entries(condition)) {
                                    if (item[key] !== value) return true;
                                }
                                return false;
                            });
                        } else {
                            // Xử lý điều kiện đơn giản
                            finalData[field] = finalData[field].filter(item => item !== condition);
                        }
                    }
                }
            }

            // Thêm timestamp
            finalData.updatedAt = new Date();
            if (!existingDoc) {
                finalData.createdAt = new Date();
            }

            await docRef.set(finalData, { merge: true });

            return { 
                modifiedCount: 1,
                upsertedId: !existingDoc ? docRef.id : null
            };
        } catch (error) {
            console.error(`Error updating document in ${this.collectionName}:`, error);
            throw error;
        }
    }

    // Xóa document
    async deleteOne(query) {
        try {
            const existingDoc = await this.findOne(query);
            
            if (!existingDoc) {
                return { deletedCount: 0 };
            }

            await this.db.collection(this.collectionName).doc(existingDoc.id).delete();
            
            return { deletedCount: 1 };
        } catch (error) {
            console.error(`Error deleting document in ${this.collectionName}:`, error);
            throw error;
        }
    }

    // Xóa nhiều documents
    async deleteMany(query) {
        try {
            const docs = await this.find(query);
            
            if (docs.length === 0) {
                return { deletedCount: 0 };
            }

            const batch = this.db.batch();
            docs.forEach(doc => {
                const docRef = this.db.collection(this.collectionName).doc(doc.id);
                batch.delete(docRef);
            });

            await batch.commit();
            
            return { deletedCount: docs.length };
        } catch (error) {
            console.error(`Error deleting documents in ${this.collectionName}:`, error);
            throw error;
        }
    }

    // Tạo document mới
    async create(data) {
        try {
            const docRef = this.db.collection(this.collectionName).doc();
            const finalData = {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await docRef.set(finalData);
            
            return { id: docRef.id, ...finalData };
        } catch (error) {
            console.error(`Error creating document in ${this.collectionName}:`, error);
            throw error;
        }
    }

    // Đếm số lượng documents
    async countDocuments(query = {}) {
        try {
            const docs = await this.find(query);
            return docs.length;
        } catch (error) {
            console.error(`Error counting documents in ${this.collectionName}:`, error);
            throw error;
        }
    }
}

module.exports = FirebaseModel;
