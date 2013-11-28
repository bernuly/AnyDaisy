<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : dtbook2ncx.xsl
    Created on : April 21, 2009, 9:58 AM
    Author     : alex
    Description:
        Purpose of transformation follows.
-->

<xsl:transform xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" 
               xmlns:dt="http://www.daisy.org/z3986/2005/dtbook/"
               xmlns="http://www.daisy.org/z3986/2005/ncx/">

<xsl:output method="xml" indent="yes"/>

<xsl:param name="href"/>

<xsl:template match="dt:dtbook">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
   <temp><xsl:number level="any"/></temp>
   <head>
    <meta name="dtb:uid" content="Bookshare" />
    <meta name="dtb:depth" content="0" />
    <meta name="dtb:generator" content="Bookshare.org" />
    <meta name="dtb:totalPageCount" content="1" />
  </head>
  <docTitle>
    <text><xsl:value-of select="dt:book/dt:frontmatter/dt:doctitle"/></text>
  </docTitle>
  <docAuthor>
    <text>Bookshare.org</text>
  </docAuthor>
  <navMap>
    <navInfo>
      <text>Primary navigation is by level</text>
    </navInfo>
    <xsl:apply-templates/>
  </navMap>
</ncx>
</xsl:template>

<xsl:template name="navpoint">
<xsl:param name="text"/>
<xsl:param name="number"/>
<navPoint>
   <xsl:attribute name="playOrder"><xsl:value-of select="substring-after(@id,'_')"/></xsl:attribute>
   <xsl:attribute name="id">nav_<xsl:value-of select="substring-after(@id,'_')"/></xsl:attribute>
  <navLabel>
    <text><xsl:value-of select="$text"/></text>
  </navLabel>
  <content>
     <xsl:attribute name="src"><xsl:value-of select="$href"/>#<xsl:value-of select="@id"/></xsl:attribute>
  </content>
<xsl:apply-templates/>
</navPoint>
</xsl:template>

<xsl:template match="dt:level">
   <xsl:call-template name="navpoint">
      <xsl:with-param name="text" select="dt:hd[1]"/>
   </xsl:call-template>
</xsl:template>

<xsl:template match="dt:level1">
   <xsl:call-template name="navpoint">
      <xsl:with-param name="text" select="dt:h1[1]"/>
   </xsl:call-template>
</xsl:template>

<xsl:template match="dt:level2">
   <xsl:call-template name="navpoint">
      <xsl:with-param name="text" select="dt:h2[1]"/>
   </xsl:call-template>
</xsl:template>

<xsl:template match="dt:level3">
   <xsl:call-template name="navpoint">
      <xsl:with-param name="text" select="dt:h3[1]"/>
   </xsl:call-template>
</xsl:template>

<xsl:template match="dt:level4">
   <xsl:call-template name="navpoint">
      <xsl:with-param name="text" select="dt:h4[1]"/>
   </xsl:call-template>
</xsl:template>

<xsl:template match="dt:level5">
   <xsl:call-template name="navpoint">
      <xsl:with-param name="text" select="dt:h5[1]"/>
   </xsl:call-template>
</xsl:template>

<xsl:template match="dt:level6">
   <xsl:call-template name="navpoint">
      <xsl:with-param name="text" select="dt:h6[1]"/>
   </xsl:call-template>
</xsl:template>

<xsl:template match="*"><xsl:apply-templates/></xsl:template>

<xsl:template match="text()"/>

</xsl:transform>
