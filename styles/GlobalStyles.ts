"use client";
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
*{
  padding: 0;
  margin: 0;
}
  body {
    margin: 0;
    font-family: 'Arial', sans-serif;
    background-color: #FFFFFF;
    color: #212529;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
`;

export default GlobalStyles;
