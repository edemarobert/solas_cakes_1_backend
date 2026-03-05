import mongoose from "mongoose";
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
import { user } from "./src/data/users.js";
import { products } from "./src/data/products.js";
import User from "./src/models/User.js";
import Cake from "./src/models/Cake.js";
import Order from "./src/models/Order.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();
connectDB();

const importData = async () => {
    try {
        await Order.deleteMany();
        await Cake.deleteMany();
        await User.deleteMany();

        const usersWithHashedPassword = await Promise.all(
            user.map(async (user) => {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                return {
                    ...user,
                    password: hashedPassword
                }
            })
        )

        const createdUsers = await User.insertMany(usersWithHashedPassword);

        const adminUser = createdUsers.find(user => user.role === 'admin');

        if (!adminUser) {
            throw new Error('Seeding failed: No user with admin role')
        }

        const adminId = adminUser._id;

        const sampleProducts = products.map((product) => {
            return {
                ...product,
                user: adminId
            }
        });

        await Cake.insertMany(sampleProducts);

        console.log('Data imported successfully!')
        process.exit();
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();