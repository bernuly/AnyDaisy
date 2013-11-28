<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : dtbook2xhtml.xsl
    Created on : January 16, 2009, 3:34 PM
    Author     : alex
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:d="http://www.daisy.org/z3986/2005/dtbook/" xmlns="http://www.w3.org/1999/xhtml" xmlns:m='http://www.w3.org/1998/Math/MathML'>
<xsl:output method="xml"/>
<xsl:param name="base-uri"/>
<xsl:param name="no-images"/>

<!-- ********************************************************************** -->
<!--   Core Templates                                                       -->
<!-- ********************************************************************** -->

<xsl:template name="coreattrs">
   <xsl:copy-of select="@id|@title"/>
</xsl:template>
<xsl:template name="i18n">
   <xsl:copy-of select="@xml:lang|@dir"/>
</xsl:template>

<xsl:template name="container">
   <xsl:element name="{local-name()}" namespace="http://www.w3.org/1999/xhtml">
      <xsl:attribute name="class">daisy-<xsl:value-of select="local-name()"/></xsl:attribute>
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </xsl:element>
</xsl:template>


<!-- ********************************************************************** -->
<!--   Document Structure                                                   -->
<!-- ********************************************************************** -->

<xsl:template match="d:dtbook">
   <xsl:apply-templates select="d:book"/>
</xsl:template>

<xsl:template match="d:book">
   <div class="daisy-book">
      <xsl:apply-templates select="d:frontmatter/d:doctitle|d:frontmatter/d:docauthor" mode="title"/>
      <xsl:apply-templates/>
      <script type="text/javascript">
      <xsl:text>var smilref = {};
</xsl:text>
      <xsl:apply-templates select="*" mode="smilref"/>
      </script>
      <script type="text/javascript">
      <xsl:text>var pages = {}; var pagelist = [];
</xsl:text>
      <xsl:apply-templates select="*" mode="pagenum"/>
      </script>
      <div class="daisy-hidden">
      <xsl:apply-templates select="*" mode="image-list-alt"/>
      </div>
      <script type="text/javascript">
      <xsl:text>var imagelist = [];
</xsl:text>
      <xsl:if test="not($no-images)">
      <xsl:apply-templates select="*" mode="image-list"/>
      </xsl:if>
      </script>
   </div>
</xsl:template>

<xsl:template match="*" mode="smilref">
<xsl:if test="@smilref and @id">smilref['<xsl:value-of select="@id"/>'] = '<xsl:value-of select="@smilref"/>';
</xsl:if>
   <xsl:apply-templates select="*" mode="smilref"/>
</xsl:template>

<xsl:template match="d:frontmatter|d:bodymatter|d:rearmatter">
   <div class="daisy-{local-name()}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </div>
</xsl:template>

<xsl:template match="d:doctitle" mode="title">
   <h1><xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/><xsl:apply-templates/></h1>
</xsl:template>

<xsl:template match="d:docauthor" mode="title">
   <h2><xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/><xsl:apply-templates/></h2>
</xsl:template>

<xsl:template match="d:doctitle|d:docauthor"/>

<xsl:template match="d:prodnote[@render='optional']|d:prodnote[not(@render)]"/>

<xsl:template match="d:list/d:prodnote[@render='required']">
   <div class="daisy-prodnote"><xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:choose>
         <xsl:when test="d:p | d:list | d:dl | d:div | d:blockquote | d:poem | d:linegroup | d:byline | d:dateline | d:epigraph | d:table | d:address | d:line">
            <xsl:apply-templates/>
         </xsl:when>
         <xsl:otherwise><p class="daisy-p"><xsl:apply-templates/></p></xsl:otherwise>
      </xsl:choose>
   </div>
</xsl:template>

<xsl:template match="d:imggroup/d:prodnote" priority="2">
   <div class="daisy-prodnote"><xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:choose>
         <xsl:when test="d:p | d:list | d:dl | d:div | d:blockquote | d:poem | d:linegroup | d:byline | d:dateline | d:epigraph | d:table | d:address | d:line">
            <xsl:apply-templates/>
         </xsl:when>
         <xsl:otherwise><p class="daisy-p"><xsl:apply-templates/></p></xsl:otherwise>
      </xsl:choose>
   </div>
</xsl:template>

<xsl:template match="d:prodnote[@render='required']">
   <div class="daisy-prodnote"><xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:choose>
         <xsl:when test="d:p | d:list | d:dl | d:div | d:blockquote | d:poem | d:linegroup | d:byline | d:dateline | d:epigraph | d:table | d:address | d:line">
            <xsl:apply-templates/>
         </xsl:when>
         <xsl:otherwise><p class="daisy-p"><xsl:apply-templates/></p></xsl:otherwise>
      </xsl:choose>
   </div>
</xsl:template>

<xsl:template match="d:pagenum" mode="pagenum">
pages['<xsl:value-of select="."/>'] = document.getElementById('<xsl:value-of select="@id"/>');
pagelist.push({ element: document.getElementById('<xsl:value-of select="@id"/>'), number: '<xsl:value-of select="."/>', section: '<xsl:value-of select="local-name(ancestor::d:bodymatter)"/><xsl:value-of select="local-name(ancestor::d:rearmatter)"/><xsl:value-of select="local-name(ancestor::d:frontmatter)"/>' });
</xsl:template>
<xsl:template match="d:pagenum[not(node())]" priority="2" mode="pagenum"/>

<xsl:template match="*" mode="pagenum">
   <xsl:apply-templates select="*" mode="pagenum"/>
</xsl:template>




<!-- ********************************************************************** -->
<!--   Element Structure                                                    -->
<!-- ********************************************************************** -->


<xsl:template match="d:level1|d:level2|d:level3|d:level4|d:level5|d:level6|d:level">
   <div class="daisy-{local-name()}" role="region">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <div class="daisy-content">
      <xsl:apply-templates/>
      </div>
   </div>
</xsl:template>

<xsl:template match="d:line/d:linenum">
<xsl:apply-templates/><xsl:text>:</xsl:text>
</xsl:template>

<xsl:template match="d:h1|d:h2|d:h3|d:h4|d:h5|d:h6|d:div">
   <xsl:call-template name="container"/>
</xsl:template>

<xsl:template match="d:sent">
   <span class="daisy-sent">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </span>
   <xsl:text>  </xsl:text>
</xsl:template>

<xsl:template match="d:img">
   <xsl:choose>
      <xsl:when test="$no-images">
         <span class="daisy-img">
            <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
            <xsl:choose>
               <xsl:when test="string-length(@alt)>0">
                  <xsl:value-of select="@alt"/>
               </xsl:when>
               <xsl:otherwise>No description of image.</xsl:otherwise>
            </xsl:choose>
         </span>
      </xsl:when>
      <xsl:otherwise>
         <xsl:choose>
            <xsl:when test="@id">
               <span class="daisy-img"><xsl:copy-of select="@id"/><xsl:value-of select="@alt"/></span>
            </xsl:when>
            <xsl:when test="starts-with(@src,'file:') or starts-with(@src,'chrome:') or starts-with(@src,'http:')">
               <img src='{@src}'>
                  <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
                  <xsl:copy-of select="@height"/>
                  <xsl:copy-of select="@width"/>
                  <xsl:copy-of select="@alt"/>
               </img>
            </xsl:when>
            <xsl:otherwise>
               <img src='{$base-uri}{@src}'>
                  <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
                  <xsl:copy-of select="@height"/>
                  <xsl:copy-of select="@width"/>
                  <xsl:copy-of select="@alt"/>
               </img>
            </xsl:otherwise>
         </xsl:choose>
      </xsl:otherwise>
   </xsl:choose>
</xsl:template>

<xsl:template match="d:table">
   <table class="daisy-table">
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
   </table>
</xsl:template>

<xsl:template match="d:table/d:p">
   <caption>
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
   </caption>
</xsl:template>

<xsl:template match="d:tr|d:td|d:th|d:tbody|d:thead|d:tfoot|d:table/d:caption|d:colgroup|d:col">
   <xsl:element name="{local-name()}" namespace="http://www.w3.org/1999/xhtml">
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
   </xsl:element>
</xsl:template>

<xsl:template match="d:w">
   <span class="daisy-w">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:for-each select="@*[local-name()='pronS'][1]">
         <xsl:attribute name="title"><xsl:value-of select="."/></xsl:attribute>
      </xsl:for-each>
      <xsl:apply-templates/>
   </span>
</xsl:template>

<xsl:template match="d:br"><br/></xsl:template>
<xsl:template match="d:hr"><hr/></xsl:template>

<xsl:template match="d:strong|d:dl|d:dt|d:dd|d:span|d:em|d:blockquote|d:sup|d:sub|d:acronym|d:a|d:pre|d:code|d:kbd|d:samp|d:abbr|d:bdo|d:q|d:address">
   <xsl:element name="{local-name()}" namespace="http://www.w3.org/1999/xhtml">
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
   </xsl:element>
</xsl:template>

<xsl:template match="d:imggroup">
   <div class="daisy-imggroup">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates select="*"/>
   </div>
</xsl:template>

<xsl:template match="d:list[@type='pl']">
   <div class='daisy-list-pl'>
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </div>
</xsl:template>

<xsl:template match="d:list[@type='pl']/d:li" priority="2">
   <p class="daisy-li daisy-li-{@class}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </p>
</xsl:template>

<xsl:template match="d:list[@type='ul']">
   <ul class="daisy-{local-name()} {@class}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </ul>
</xsl:template>

<xsl:template match="d:list[@type='ul'][d:hd]" priority="2">
   <div class="daisy-ol">
      <xsl:apply-templates select="d:hd|d:prodnote"/>
      <ul class="daisy-{local-name()} {@class}">
         <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
         <xsl:apply-templates select="d:li"/>
      </ul>
   </div>
</xsl:template>

<xsl:template match="d:list[@type='ol']">
   <ol class="daisy-{local-name()} {@class}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </ol>
</xsl:template>

<xsl:template match="d:list[@type='ol'][d:hd]" priority="2">
   <div class="daisy-ol">
      <xsl:apply-templates select="d:hd|d:prodnote"/>
      <ol class="daisy-{local-name()} {@class}">
         <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
         <xsl:apply-templates select="d:li"/>
      </ol>
   </div>
</xsl:template>
<xsl:template match="d:li">
   <xsl:call-template name="container"/>
</xsl:template>

<xsl:template name="sidebar">
   <div class="daisy-sidebar" role="complementary">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </div>
</xsl:template>
<xsl:template match="d:sidebar">
   <xsl:call-template name="sidebar"/>
</xsl:template>

<xsl:template match="d:sidebar/d:hd">
   <h3>
      <xsl:choose>
         <xsl:when test="count(preceding-sibling::*)>0">
            <xsl:attribute name="class">daisy-hd</xsl:attribute>
         </xsl:when>
         <xsl:otherwise>
            <xsl:attribute name="class">daisy-hd daisy-skip</xsl:attribute>
         </xsl:otherwise>
      </xsl:choose>
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </h3>
</xsl:template>


<xsl:template match="m:math"><span role="math"><xsl:copy-of select="."/></span></xsl:template>

<xsl:template match="d:annoref"><a href="#{@idref}" class="daisy-annoref" role="note" title="annotation reference"><xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/><xsl:apply-templates/></a></xsl:template>
<xsl:template match="d:noteref"><span class="daisy-note-ref" role="note" title="note reference">[<xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/><xsl:apply-templates/>]</span></xsl:template>

<xsl:template match="d:annotation">
   <div class="daisy-annotation" role="note">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <span class="daisy-closer daisy-skip">X</span>
      <xsl:apply-templates/>
   </div>
</xsl:template>
<xsl:template match="d:note">
   <div class="daisy-note" role="note">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <div class="daisy-skip" role="note-container">
         <xsl:apply-templates/>
      </div>
   </div>
</xsl:template>

<xsl:template match="d:author|d:epigraph|d:byline|d:dateline|d:linegroup|d:poem">
   <div class="daisy-{local-name()} {@class}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </div>
</xsl:template>

<xsl:template match="d:line|d:hd|d:p|d:pagenum|d:caption|d:bridgehead">
   <p class="daisy-{local-name()} {@class}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </p>
</xsl:template>

<xsl:template match="d:pagenum[not(node())]" priority="2"/>

<xsl:template match="d:address/d:line">
   <span class="daisy-{local-name()} {@class}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </span>
   <br/>
</xsl:template>


<xsl:template match="d:dfn|d:cite|d:cite/d:title|d:cite/d:author|d:lic">
   <span class="daisy-{local-name()}">
      <xsl:call-template name="coreattrs"/><xsl:call-template name="i18n"/>
      <xsl:apply-templates/>
   </span>
</xsl:template>


<xsl:template match="d:*">
   <p class="error">Unknown Daisy Element: <xsl:value-of select="local-name()"/></p>
</xsl:template>

<!-- ************************************************** -->
<!-- image-list mode -->
<!-- ************************************************** -->

<!-- TODO: need safe-string procedure for quoted strings -->

<xsl:template match="d:img[@id]" mode="image-list">
   try {
      imagelist.push({
         id: "<xsl:value-of select="@id"/>",
         height: "<xsl:value-of select="@height"/>",
         width: "<xsl:value-of select="@width"/>",
<xsl:choose>
<xsl:when test="starts-with(@src,'file:') or starts-with(@src,'chrome:') or starts-with(@src,'http:')">
         src: "<xsl:value-of select="@src"/>"
</xsl:when>
<xsl:otherwise>
         src: "<xsl:value-of select="concat($base-uri,@src)"/>"
</xsl:otherwise>
</xsl:choose>
      });
   } catch (ex) {
   }
</xsl:template>
<xsl:template match="text()" mode="image-list"/>
<xsl:template match="*" mode="image-list">
   <xsl:apply-templates mode="image-list"/>
</xsl:template>

<xsl:template match="d:img[@id]" mode="image-list-alt">
   <span id='daisy-image-alt-{@id}'><xsl:value-of select="@alt"/></span>
</xsl:template>
<xsl:template match="text()" mode="image-list-alt"/>
<xsl:template match="*" mode="image-list-alt">
   <xsl:apply-templates mode="image-list-alt"/>
</xsl:template>


</xsl:stylesheet>
