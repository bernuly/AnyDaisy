<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : dtbook2ncx.xsl
    Created on : April 21, 2009, 9:58 AM
    Author     : alex
    Description:
        Purpose of transformation follows.
-->

<xsl:transform xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" 
               xmlns:dt="http://www.daisy.org/z3986/2005/dtbook/">

<xsl:output method="xml"/>

<xsl:template match="*">
   <xsl:copy>
      <xsl:choose>
         <xsl:when test="@id">
            <xsl:copy-of select="@id"/>
         </xsl:when>
         <xsl:otherwise>
            <xsl:attribute name="id"><xsl:value-of select="local-name()"/>_<xsl:number level="any"/></xsl:attribute>
         </xsl:otherwise>
      </xsl:choose>
      <xsl:for-each select="@*[local-name()!='id']">
         <xsl:copy-of select="."/>
      </xsl:for-each>
      <xsl:apply-templates/>
   </xsl:copy>
</xsl:template>

<xsl:template match="comment()|processing-instruction()">
   <xsl:copy-of select="."/>
</xsl:template>

</xsl:transform>
