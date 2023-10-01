const express= require('express')
const cors=require('cors')
const jwt= require('jsonwebtoken')
const app=express();
const port=process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.px2gaoj.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  } 
});

function verifyJWT(req,res,next)
{
  const authHeaders=req.headers.authorization;
  if(!authHeaders)
  {
    res.status(401).send({message:'unauthorised access'})
  }
  const token= authHeaders.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(error,decoded)
  {
    if(error)
    {
      res.status(401).send({message:'unauthorised access'})
    }
    req.decoded=decoded;
    next();
  })
}

async function run() {
  try {

            const serviceCollection=client.db('superCar').collection('services')
            const orderCollections=client.db('superCar').collection('orders')


            app.post('/jwt',(req,res)=>
            {
              const user=req.body;
              const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
              res.send({token})
            })

            

            app.get('/services',async(req,res)=>
            {
                const search = req.query.search
                console.log(search)
                let query={};
                if (search.length) 
                {
                  query={
                    $text:{
                      $search:search
                    }
                  }
                }
              
                const order=req.query.order==='asc'? 1:-1;

                const cursor= serviceCollection.find(query).sort({price:order})
                const services= await cursor.toArray();
                res.send(services)
            })



            app.get('/services/:id',async(req,res)=>
            {
                const id=req.params.id;
                const query={_id: new ObjectId(id)};
                const service=await serviceCollection.findOne(query)
                res.send(service)
            })




            // orders api
            app.get('/orders',verifyJWT,async (req,res)=>
            {
                const decoded=req.decoded
                if(decoded.email!==req.query.email)
                {
                  res.status(403).send({message:'unauhtorised access'})
                }

                let query={}
                if(req.query.email)
                {
                  query={
                    email:req.query.email
                  }
                }
                const cursor=orderCollections.find(query)
                const orders=await cursor.toArray();
                res.send(orders)
            })

            app.post('/orders', async(req,res)=>
            {
              const order=req.body
              const result=await orderCollections.insertOne(order);
              res.send(result)
            })

            app.patch('/orders/:id',async(req,res)=>
            {
              const id =req.params.id
              const status=req.body.status
              const query={_id: new ObjectId(id)}
              const updateDoc={
                $set:
                {
                  status:status
                }
              }
              const result = await orderCollections.updateOne(query,updateDoc)
              res.send(result)
                
            })

            app.delete('/orders/:id', async(req,res)=>
            {
              const id=req.params.id;
              const query={_id: new ObjectId(id)}
              const result= await orderCollections.deleteOne(query)
              res.send(result);
            })

            
  } 
  
  finally {

}
}
run().catch(console.dir);


app.get('/',(req,res)=>
{
    res.send('Port running')
})

app.listen(port,()=>
{
    console.log(`running on ${port}`)
})


// superCarDB
// Rvh9RUfrjjYjLZMx