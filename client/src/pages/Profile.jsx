// import React, { useState ,useEffect} from 'react'
// import { useSelector } from 'react-redux';
// import { useRef } from 'react';
// import { ref } from 'firebase/storage';
// import {getStorage,uploadBytes,getDownloadURL, uploadBytesResumable} from "firebase/storage"
// import { app } from '../firebase';
// function Profile() {
//   const fileRef=useRef(null)
//   const {currentUser}=useSelector((state)=>state.user)
//   const [file,setFile]=useState(undefined)
//   console.log(file);
//   const handleFileUpload=async(file)=>{
//     const  storage=getStorage(app);
//     const filename=new Date().getTime()+file.name;
//     const  storageRef=ref(storage,filename);
//     const uploadTask=await uploadBytesResumable(storageRef,file);
//     uploadTask.on('state_changed',
//       (snapshot)=>{
//         const progress=(snapshot.bytesTransferred/snapshot.totalBytes)*100
//         console.log('upload is'+progress+"%done");
//       }
//     )
    
//   }
//   useEffect(()=>{
//     handleFileUpload(file);
//   },[file])
//   return (
//     <div  className='p-3 max-w-lg mx-auto'>
//       <h1 className='text3xl font-semibold text-center my-7'>Profile</h1>
//       <form className="flex flex-col gap-4">
//         <input onChange={(e)=>setFile(e.target.files[0])} type='file' ref={fileRef} hidden accept='image/*'/>  
//         <img onClick={()=>{fileRef.current.click()}} className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2' src={currentUser.avatar} alt='profile'/>
//         <input type='text' placeholder='username' className='border p-3 rounded-lg' id='username'/>
//         <input type='email' placeholder='email' className='border p-3 rounded-lg' id='email'/>
//         <input type='text' placeholder='password' className='border p-3 rounded-lg' id='password'/>
//         <button className='bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'>update</button>
//       </form>
//       <div className='flex justify-between mt-5 '>
//         <span className='text-red-700 cursor-pointer'>Delete account</span>
//         <span className='text-red-700 cursor-pointer'>Sign Out</span>
//       </div>
//     </div>
//   )
// }

// export default Profile;
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRef } from 'react';
import { ref, getStorage, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';
import { updateUserStart,updateUserSuccess,updateUserFailure,deleteUserStart,deleteUserSuccess,deleteUserFailure, signOutUserStart} from '../redux/user/userSlice';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
function Profile() {
  const dispatch=useDispatch();
  const fileRef = useRef(null);
  const { currentUser,loading,error} = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess,setUpdateSuccess]=useState(false);
  const [showListingsError,setShowListingsError]=useState(false);
  const [userListings,setUserListings]=useState([])
  console.log(filePerc);
  console.log("form:",formData);
  const handleFileUpload = async (file) => {
    try { 
      const storage = getStorage(app);
      const filename = new Date().getTime() + file.name;
      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFilePerc(Math.round(progress));
        },
        (error) => {
          console.error('Error uploading file:', error);
          setFileUploadError(true);
        },
        () => {
          // Upload completed successfully
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadUrl) => {
              setFormData({ ...formData, avatar: downloadUrl });
            })
            .catch((error) => {
              console.error('Error getting download URL:', error);
              setFileUploadError(true);
            });
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      setFileUploadError(true);
    }
  };
  const handleChange=(e)=>{
    setFormData({...formData,[e.target.id]:e.target.value})
  }
  const handleSubmit=async(e)=>{
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res=await fetch(`/api/user/update/${currentUser._id}`,{
        method:'POST',
        headers:{
          'Content-type':'application/json',
        },
        body:JSON.stringify(formData)
      });
      const data=await res.json();
      if(data.success===false){
        dispatch(updateUserFailure(data.message));
        return
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message))
    }
  }
  const handleDeleteUser=async()=>{
    try {
      dispatch(deleteUserStart());
      const res=await fetch(`/api/user/delete/${currentUser._id}`,{
        method:'DELETE'
      });
      const data=await res.json();
      if(data.success===false){
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  }
  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(data.message));
    }
  };
  useEffect(() => {
    if (file) {
      handleFileUpload(file);
      handleChange;
      handleSubmit;
    }
  }, [file]);
  const handleShowListings=async()=>{
    try{
      setShowListingsError(false);
      const res=await fetch(`/api/user/listings/${currentUser._id}`)
      const data=await res.json();
      console.log(data);
      if(data.success===false){
        setShowListingsError(true);
        return;
      }
      setUserListings(data);
    }
    catch(error){
      setShowListingsError(true);
    }
  }
  const handleListingDelete=async(listingId)=>{
    try{
      const res=await fetch(`/api/listing/delete/${listingId}`,{
        method:'DELETE',
      });
      const data=await res.json();
      if(data.success===false){
        console.log(data.message);
        return;
      }
      setUserListings((prev)=>prev.filter((listing)=>listing._id!==listingId));
    }
    catch(error){
      console.log(error.message);
    }
  }
  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input onChange={(e) => setFile(e.target.files[0])} type='file' ref={fileRef} hidden accept='image/*' />
        <img onClick={() => fileRef.current.click()} className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2' src={formData?.avatar||currentUser.avatar} alt='profile' />
        <p className='text-sm self-center'>
          {fileUploadError?
            (<span className='text-red-700'>Error image upload(image must be less than 2mb)</span>)
            :filePerc>0 && filePerc<100 ?(
              <span className='text-slate-700'>{`uploading ${filePerc}%`}</span>
            ):filePerc===100?(
              <span className='text-green-700'>Image successfully uploaded!</span>
            ):(
              ''
            )}
        </p>
        <div>
            <input onChange={(e)=>{handleChange(e)}} defaultValue={currentUser.username} type='text' placeholder='username' className='border p-3 rounded-lg' id='username' />
        <input onChange={(e)=>{handleChange(e)}} defaultValue={currentUser.email} type='email' placeholder='email' className='border p-3 rounded-lg' id='email' />
        <input onChange={(e)=>{handleChange(e)}} type='password' placeholder='password' className='border p-3 rounded-lg' id='password' />
        <button disabled={loading} type="submit" className='bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'>{loading?'Loading...':'Update'}</button>
        <Link className="bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95" to="/create-listing">Create Listing</Link>
        </div>
      </form>
      <div className='flex justify-between mt-5'>
        <span className='text-red-700 cursor-pointer' onClick={handleDeleteUser} >Delete account</span>
        <span  onClick={handleSignOut} className='text-red-700 cursor-pointer'>Sign Out</span>
      </div>
      <p className='text-red-700 mt-5'>{error?error:""}</p>
      <p className='text-green-700 mt-5'>{updateSuccess?'User is updated successfully!':''}</p>
      <button onClick={handleShowListings} className='text-green-700 w-full'>Show Listings</button>
      <p className='text-red-700 mt-5'>{showListingsError ?"Error showing listings":""}</p>
      {userListings && userListings.length>0 && 
        <div className='flex flex-col gap-4'>
        <h1 className='text-center mt-7 text-2xl font-semibold'>Your Listings</h1>
          {userListings.map((listing)=>
            <div  key={listing._id} className='border rounded-lg p-3 flex justify-between items-center gap-4'>
              <Link to={`/listing/${listing._id}`}>
                <img src={listing.imageUrls[0]} alt='listing cover' className='h-16 w-16 object-contain rounded-lg'/>
              </Link>
              <Link className='text-slate-700 font-semibold  hover:underline truncate'  to={`/listing/${listing._id}`}>
                <p className='text-slate-700 font-semibold  hover:underline truncate'>{listing.name}</p>
              </Link>
              <div className='flex flex-col items-center'>
                <button onClick={()=>handleListingDelete(listing._id)} className='text-red-700 uppercase'>Delete</button>
                <Link to={`/update-listing/${listing._id}`}><button className='text-green-700 uppercase'>Edit</button></Link>
              </div> 
            </div>
          )} 
        </div>
      }
    </div>
  );
}

export default Profile;
