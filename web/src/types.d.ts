declare module 'react-plotly.js/factory' {
  import { Component } from 'react'
  export default function createPlotlyComponent(plotly: any): typeof Component
}

declare module 'plotly.js-basic-dist-min' {
  const Plotly: any
  export default Plotly
}
