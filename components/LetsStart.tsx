import React from 'react'

const LetsStart = () => {
  return (
    <div className="w-full bg-black py-12 px-4 md:px-8 lg:px-16 flex flex-col items-start gap-4 mb-10 mt-70">
      <h1 className="text-2xl md:text-8xl text-white/70">
        Your Campaign,
      </h1>
      <div className="w-full flex justify-center overflow-visible pb-16">
        <h1 
          className="text-[7vh] md:text-[30vh] lg:text-[35vh] leading-none pr-4 tracking-tight"
          style={{
            backgroundImage: 'url(https://i.postimg.cc/0N54FrqK/f9c2639218dc8d130ee6eda052ace4d5.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            paddingBottom: '0.2em', 
          }}
        >
          Simplified.
        </h1>
      </div>
    </div>
  )
}

export default LetsStart