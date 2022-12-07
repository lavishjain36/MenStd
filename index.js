import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import {MongoClient} from "mongodb";

dotenv.config();
const app=express();
const PORT=process.env.PORT;
const MONGO_URL=process.env.MONGO_URL;


app.use(express.json());
app.use(cors());


app.get("/",(req,res)=>{
    res.send("<h1>Server is live and running</h1>");
})

const createConnection=async()=>{
    const client=new MongoClient(MONGO_URL);
    await client.connect();
    console.log("MongoDb connection established")

    return client;
}

const client=await createConnection();


//Write an api Logic to Add a mentor
app.post("/create-mentor",async(req,res)=>{
    const data=req.body;
    const result=await client
    .db("mentor-student")
    .collection("mentors")
    .insertOne(data);

    result.acknowledged
    ?res.status(200).send({msg:"mentor added successfully"})
    :res.status(400).send({msg:"something went wrong.Please try again!!"});
})


//endpoint to list all the mentrs

app.get("/mentor-list",async(req,res)=>{
    const result=await client 
    .db("mentor-student")
    .collection("mentors")
    .find({})
    .toArray();
    res.send(result);
})

//endpoint to add student 
app.post("/create-student",async(req,res)=>{
    const data=req.body;

    const result=await client 
    .db("mentor-student")
    .collection("students")
    .insertOne(data);


    result.acknowledged
    ?res.status(200).send({msg:"Student added successfully"})
    :res 
    .status(400)
    .send({msg:"Something went wrong.Please try again"})
})


//endpoint to list all the students that are not assigned to a mentor

app.get('/unassigned_students',async(req,res)=>{
    const result=await client 
    .db("mentor-student")
    .collection("students")
    .find({mentor_assigned:false})
    .toArray();
    res.send(result);
})


//endpoint to list all the students that are assigned to a mentor

app.get('/assigned_students',async(req,res)=>{
    const result=await client 
    .db("mentor-student")
    .collection("students")
    .find({mentor_assigned:true})
    .toArray();
    res.send(result);
})


//endpoint to assign a student to a mentor 
app.post('/assgin_mentor',async(req,res)=>{
    const data=req.body;

    const result=await client 
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
        {mentor_name:data.mentor_name},
        {$set:{students_assigned:data.students_assigned}}
    )

    data.students_assigned.map(async(student)=>{
        await client 
        .db("mentor-student")
        .collection("students")
        .updateOne(
            {student_name:student},
            {$set:{mentor_assigned:true,mentor_name:data.mentor_name}}
        )
    })

    result.acknowledged
    ?res.status(200).send({msg:"Student assigned successfully"})
    :res 
    .status(400)
    .send({msg:"Something went wrong.Please try again"})
})


//endpoint to update or change the mentor 
app.post('/change_mentor',async(req,res)=>{
    const data=req.body;

    await client
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
        {mentor_name:data.previous_mentor},
        {$pull:{students_assigned:data.student_name}}
    )

    await client 
    .db("mentor-student")
    .collection("students")
    .updateOne(
        {student_name:data.student_name},
        {$set:{mentor_name:data.new_mentor}}
    )

   const result= await client 
    .db("mentor-student")
    .collection("mentors")
    .updateOne(
        {mentor_name:data.new_mentor},
        {$push:{students_assigned:data.student_name}}
    )

    result.acknowledged
    ?res.status(200).send({msg:"Teacher Changed successfully"})
    :res 
    .status(400)
    .send({msg:"Something went wrong.Please try again"})
})








app.listen(PORT,()=>console.log("Server listening on port ",PORT));